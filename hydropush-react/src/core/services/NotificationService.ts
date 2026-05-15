import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { notificationLogger } from './NotificationLogger';
import { retryWithBackoff, generateNotificationId } from '../utils/notificationUtils';
import { NotificationHistoryItem } from '../types/notificationTypes';


export interface NotificationOptions {
  title: string;
  body: string;
  id?: number;
  scheduledTime?: Date;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: Date;
  interval?: number;
  data?: any;
}

export interface ShowNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

class NotificationService {
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private notificationCheckInterval?: number;
  private notificationHistory: NotificationHistoryItem[] = [];
  private readonly HISTORY_KEY = 'notification_history';
  private readonly SCHEDULED_KEY = 'scheduled_notifications';
  private readonly MAX_HISTORY = 50;

  constructor() {
    this.loadScheduledNotifications();
    this.loadNotificationHistory();
    notificationLogger.info('NotificationService initialized', { platform: Capacitor.getPlatform() });

    // Inicializar listeners de push notifications em plataformas nativas
    if (Capacitor.isNativePlatform()) {
      this.setupPushNotificationListeners();
      this.checkAndRegisterPush();
    }
  }

  private async checkAndRegisterPush() {
    try {
      const permission = await this.checkPermissions();
      if (permission === 'granted') {
        await PushNotifications.register();
        notificationLogger.info('Auto-registered for push notifications on startup');
      }
    } catch (error) {
      notificationLogger.error('Failed to auto-register push', error);
    }
  }

  /**
   * Configurar listeners de push notifications nativas
   */
  private async setupPushNotificationListeners() {
    try {
      // Listener para registro bem-sucedido
      await PushNotifications.addListener('registration', (token) => {
        notificationLogger.info('Push registration success', { token: token.value });
        console.log('🔔 Push notification token:', token.value);
      });

      // Listener para erro de registro
      await PushNotifications.addListener('registrationError', (error) => {
        notificationLogger.error('Push registration error', error);
        console.error('❌ Push registration error:', error);
      });

      // Listener para notificação recebida
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        notificationLogger.info('Push notification received', notification);
        console.log('📩 Push received:', notification);
      });

      // Listener para ação em notificação
      await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        notificationLogger.info('Push notification action performed', notification);
        console.log('👆 Push action:', notification);
      });

      notificationLogger.info('Push notification listeners configured');
    } catch (error) {
      notificationLogger.error('Failed to setup push listeners', error);
    }
  }

  /**
   * Solicita permissão para notificações
   */
  async requestPermission(): Promise<'granted' | 'denied'> {
    notificationLogger.info('Requesting notification permission');

    if (Capacitor.isNativePlatform()) {
      try {
        // Usar PushNotifications para permissões (mais robusto no Android 13+)
        notificationLogger.debug('Platform: Native - Requesting PushNotifications permission');

        const result = await PushNotifications.requestPermissions();
        const permission = result.receive === 'granted' ? 'granted' : 'denied';

        notificationLogger.info(`Native permission ${permission}`, {
          result,
          receive: result.receive
        });

        if (permission === 'granted') {
          // Registrar para push notifications
          await PushNotifications.register();
          notificationLogger.info('Push notifications registered');
        } else {
          notificationLogger.warn('User denied notification permission', {
            message: 'Notifications will not work until user grants permission in system settings'
          });
        }

        return permission;
      } catch (error) {
        notificationLogger.error('Failed to request native permission', error);
        console.error('[NotificationService] ❌ Error requesting permission:', error);
        return 'denied';
      }
    } else {
      // Fallback para Web
      if (!('Notification' in window)) {
        notificationLogger.warn('Notifications not supported in this browser');
        return 'denied';
      }

      try {
        const permission = await Notification.requestPermission();
        notificationLogger.info(`Web permission ${permission}`);
        return permission === 'granted' ? 'granted' : 'denied';
      } catch (error) {
        notificationLogger.error('Failed to request web permission', error);
        return 'denied';
      }
    }
  }

  /**
   * Verifica permissões de forma assíncrona (método robusto)
   */
  async checkPermissions(): Promise<'granted' | 'denied' | 'default'> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await PushNotifications.checkPermissions();
        const status = result.receive;
        notificationLogger.debug('Permission status checked', { status });
        if (status === 'prompt' || status === 'prompt-with-rationale') {
          return 'default';
        }
        return status;
      } catch (error) {
        notificationLogger.error('Failed to check native permissions', error);
        return 'default';
      }
    } else {
      if (!('Notification' in window)) {
        return 'denied';
      }
      return Notification.permission as 'granted' | 'denied' | 'default';
    }
  }

  /**
   * Obtém status de permissão de forma síncrona (compatibilidade)
   */
  getPermissionStatus(): 'granted' | 'denied' | 'default' {
    if (Capacitor.isNativePlatform()) {
      return 'default';
    } else {
      if (!('Notification' in window)) return 'denied';
      return Notification.permission;
    }
  }

  /**
   * Exibe notificação imediata
   */
  async showNotification(options: ShowNotificationOptions): Promise<void> {
    notificationLogger.info('Showing notification', { title: options.title });

    if (Capacitor.isNativePlatform()) {
      const result = await retryWithBackoff(async () => {
        await LocalNotifications.schedule({
          notifications: [{
            title: options.title,
            body: options.body,
            id: Math.floor(Date.now() / 1000),
            schedule: { at: new Date(Date.now() + 100) },
            smallIcon: 'ic_stat_droplets',
            actionTypeId: '',
            extra: null
          }]
        });
      }, { maxRetries: 2, initialDelayMs: 500, maxDelayMs: 2000, backoffMultiplier: 2 });

      if (result.success) {
        notificationLogger.info('Native notification scheduled successfully');
        this.addToHistory({
          id: generateNotificationId('push'),
          type: 'push',
          title: options.title,
          body: options.body,
          sentAt: new Date(),
          status: 'sent'
        });
      } else {
        notificationLogger.error('Failed to show native notification after retries', result.error);
        throw result.error;
      }
    } else {
      // Web
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(options.title, {
            body: options.body,
            icon: options.icon || '/favicon.ico',
            tag: options.tag
          });
          notificationLogger.info('Web notification shown successfully');
          this.addToHistory({
            id: generateNotificationId('push'),
            type: 'push',
            title: options.title,
            body: options.body,
            sentAt: new Date(),
            status: 'sent'
          });
        } catch (error) {
          notificationLogger.error('Failed to show web notification', error);
          throw error;
        }
      } else {
        notificationLogger.warn('Web notification permission not granted');
      }
    }
  }

  /**
   * Inicia verificação de notificações agendadas (Web only)
   */
  startNotificationChecker(): void {
    if (Capacitor.isNativePlatform()) {
      notificationLogger.debug('Notification checker not needed on native platform');
      return;
    }

    if (this.notificationCheckInterval) {
      clearInterval(this.notificationCheckInterval);
    }

    this.notificationCheckInterval = window.setInterval(() => {
      this.checkScheduledNotifications();
    }, 60000); // Verificar a cada 1 minuto

    notificationLogger.info('Notification checker started');
  }

  /**
   * Verifica e dispara notificações agendadas (Web)
   */
  private checkScheduledNotifications(): void {
    const now = Date.now();
    let dispatched = 0;

    this.scheduledNotifications.forEach((notification, id) => {
      if (notification.scheduledTime.getTime() <= now) {
        notificationLogger.debug('Dispatching scheduled notification', { id, title: notification.title });

        this.showNotification({
          title: notification.title,
          body: notification.body,
          icon: '/favicon.ico'
        }).catch(err => {
          notificationLogger.error('Failed to dispatch scheduled notification', { id, error: err });
        });

        dispatched++;

        // Se tem intervalo, reagendar
        if (notification.interval) {
          notification.scheduledTime = new Date(now + notification.interval * 60 * 1000);
          notificationLogger.debug('Rescheduled recurring notification', { id, nextTime: notification.scheduledTime });
        } else {
          this.scheduledNotifications.delete(id);
          notificationLogger.debug('Removed one-time notification', { id });
        }
      }
    });

    if (dispatched > 0) {
      this.saveScheduledNotifications();
      notificationLogger.info(`Dispatched ${dispatched} scheduled notifications`);
    }
  }

  /**
   * Verifica se notificações são suportadas
   */
  isSupported(): boolean {
    if (Capacitor.isNativePlatform()) {
      return true;
    }
    return 'Notification' in window;
  }

  /**
   * Agenda notificação com retry automático
   */
  async scheduleNotification(notification: ScheduledNotification | NotificationOptions): Promise<void> {
    let scheduledNotif: ScheduledNotification;

    if ('scheduledTime' in notification && notification.scheduledTime) {
      scheduledNotif = notification as ScheduledNotification;
    } else {
      const notifOptions = notification as NotificationOptions;
      scheduledNotif = {
        id: notifOptions.id?.toString() || generateNotificationId('scheduled'),
        title: notifOptions.title,
        body: notifOptions.body,
        scheduledTime: notifOptions.scheduledTime || new Date(),
        data: {}
      };
    }

    const id = scheduledNotif.id || generateNotificationId('scheduled');

    notificationLogger.info('Scheduling notification', {
      id,
      title: scheduledNotif.title,
      scheduledTime: scheduledNotif.scheduledTime
    });

    if (Capacitor.isNativePlatform()) {
      const result = await retryWithBackoff(async () => {
        await LocalNotifications.schedule({
          notifications: [{
            title: scheduledNotif.title,
            body: scheduledNotif.body,
            id: parseInt(id) || Math.floor(Date.now() / 1000),
            schedule: scheduledNotif.scheduledTime ? { at: scheduledNotif.scheduledTime } : undefined,
            smallIcon: 'ic_stat_droplets',
            actionTypeId: '',
            extra: scheduledNotif.data || null
          }]
        });
      }, { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 5000, backoffMultiplier: 2 });

      if (result.success) {
        notificationLogger.info('Native notification scheduled successfully', {
          id,
          retriedCount: result.retriedCount
        });
      } else {
        notificationLogger.error('Failed to schedule native notification after retries', {
          id,
          error: result.error,
          retriedCount: result.retriedCount
        });
        throw result.error;
      }
    } else {
      // Web: armazenar em memória
      this.scheduledNotifications.set(id, scheduledNotif);
      this.saveScheduledNotifications();
      notificationLogger.info('Web notification stored for scheduling', { id });
    }
  }

  /**
   * Obtém notificações pendentes
   */
  async getPendingNotifications(): Promise<ScheduledNotification[]> {
    if (Capacitor.isNativePlatform()) {
      try {
        const pending = await LocalNotifications.getPending();
        return pending.notifications.map(n => ({
          id: n.id.toString(),
          title: n.title,
          body: n.body,
          scheduledTime: n.schedule?.at ? new Date(n.schedule.at) : new Date(),
          data: n.extra
        }));
      } catch (error) {
        notificationLogger.error('Failed to get pending native notifications', error);
        return [];
      }
    } else {
      return Array.from(this.scheduledNotifications.values());
    }
  }

  /**
   * Cancela todas as notificações agendadas
   */
  async cancelAllNotifications(): Promise<void> {
    notificationLogger.info('Canceling all notifications');

    if (Capacitor.isNativePlatform()) {
      try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel(pending);
          notificationLogger.info(`Cancelled ${pending.notifications.length} native notifications`);
        }
      } catch (error) {
        notificationLogger.error('Failed to cancel native notifications', error);
      }
    } else {
      const count = this.scheduledNotifications.size;
      this.scheduledNotifications.clear();
      this.saveScheduledNotifications();
      notificationLogger.info(`Cleared ${count} web notifications`);
    }
  }

  /**
   * Salva notificações agendadas no localStorage
   */
  private saveScheduledNotifications(): void {
    try {
      const stored = Array.from(this.scheduledNotifications.entries());
      localStorage.setItem(this.SCHEDULED_KEY, JSON.stringify(stored));
    } catch (error) {
      notificationLogger.warn('Failed to save scheduled notifications', error);
    }
  }

  /**
   * Carrega notificações agendadas do localStorage
   */
  private loadScheduledNotifications(): void {
    try {
      const stored = localStorage.getItem(this.SCHEDULED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.scheduledNotifications = new Map(
          parsed.map((entry: [string, any]) => [
            entry[0],
            {
              ...entry[1],
              scheduledTime: new Date(entry[1].scheduledTime)
            }
          ])
        );
        notificationLogger.debug('Loaded scheduled notifications', {
          count: this.scheduledNotifications.size
        });
      }
    } catch (error) {
      notificationLogger.warn('Failed to load scheduled notifications', error);
    }
  }

  /**
   * Adiciona notificação ao histórico
   */
  private addToHistory(item: NotificationHistoryItem): void {
    this.notificationHistory.unshift(item);

    // Limitar tamanho do histórico
    if (this.notificationHistory.length > this.MAX_HISTORY) {
      this.notificationHistory = this.notificationHistory.slice(0, this.MAX_HISTORY);
    }

    this.saveNotificationHistory();
  }

  /**
   * Salva histórico de notificações
   */
  private saveNotificationHistory(): void {
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.notificationHistory));
    } catch (error) {
      notificationLogger.warn('Failed to save notification history', error);
    }
  }

  /**
   * Carrega histórico de notificações
   */
  private loadNotificationHistory(): void {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notificationHistory = parsed.map((item: any) => ({
          ...item,
          sentAt: new Date(item.sentAt)
        }));
        notificationLogger.debug('Loaded notification history', {
          count: this.notificationHistory.length
        });
      }
    } catch (error) {
      notificationLogger.warn('Failed to load notification history', error);
    }
  }

  /**
   * Obtém histórico de notificações
   */
  getNotificationHistory(limit: number = 10): NotificationHistoryItem[] {
    return this.notificationHistory.slice(0, limit);
  }

  /**
   * Limpa notificações antigas do histórico
   */
  clearOldNotifications(daysOld: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const originalCount = this.notificationHistory.length;
    this.notificationHistory = this.notificationHistory.filter(
      item => item.sentAt > cutoffDate
    );

    const removed = originalCount - this.notificationHistory.length;
    if (removed > 0) {
      this.saveNotificationHistory();
      notificationLogger.info(`Cleared ${removed} old notifications`);
    }
  }

  /**
   * Limpa todo o histórico
   */
  clearHistory(): void {
    this.notificationHistory = [];
    this.saveNotificationHistory();
    notificationLogger.info('Cleared all notification history');
  }
}

export const notificationService = new NotificationService();

// Inicializar ouvintes se necessário

