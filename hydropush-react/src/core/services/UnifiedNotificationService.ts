/**
 * Serviço unificado para coordenar notificações push e email
 */

import { notificationService } from './NotificationService';

import { notificationLogger } from './NotificationLogger';
import { storageService } from './StorageService';
import { UnifiedNotificationOptions, NotificationResult, NotificationType } from '../types/notificationTypes';
import { generateNotificationId } from '../utils/notificationUtils';

class UnifiedNotificationService {
    /**
     * Envia notificação de forma unificada (push e/ou email)
     */
    async sendNotification(options: UnifiedNotificationOptions): Promise<NotificationResult[]> {
        const results: NotificationResult[] = [];

        notificationLogger.info('Sending unified notification', {
            title: options.title,
            sendPush: options.sendPush
        }, 'UnifiedService');

        // Enviar notificação push
        if (options.sendPush) {
            const pushResult = await this.sendPushNotification(options);
            results.push(pushResult);


        }



        const successCount = results.filter(r => r.success).length;
        notificationLogger.info(`Unified notification completed`, {
            total: results.length,
            successful: successCount,
            failed: results.length - successCount
        }, 'UnifiedService');

        return results;
    }

    /**
     * Envia notificação push
     */
    private async sendPushNotification(options: UnifiedNotificationOptions): Promise<NotificationResult> {
        try {
            // Verificar permissões
            const permission = await notificationService.checkPermissions();
            if (permission !== 'granted') {
                notificationLogger.warn('Push notification permission not granted', { permission }, 'UnifiedService');
                return {
                    success: false,
                    type: 'push',
                    error: 'Permissão de notificação não concedida'
                };
            }

            // Verificar se deve agendar ou enviar imediatamente
            if (options.scheduledTime && options.scheduledTime > new Date()) {
                await notificationService.scheduleNotification({
                    id: generateNotificationId('unified_push'),
                    title: options.title,
                    body: options.body,
                    scheduledTime: options.scheduledTime,
                    data: options.data
                });

                return {
                    success: true,
                    type: 'push',
                    id: generateNotificationId('unified_push'),
                    sentAt: new Date()
                };
            } else {
                await notificationService.showNotification({
                    title: options.title,
                    body: options.body,
                    icon: '/favicon.ico'
                });

                return {
                    success: true,
                    type: 'push',
                    id: generateNotificationId('unified_push'),
                    sentAt: new Date()
                };
            }
        } catch (error) {
            notificationLogger.error('Failed to send push notification', error, 'UnifiedService');
            return {
                success: false,
                type: 'push',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }



    /**
     * Envia lembrete de hidratação (push + email se configurado)
     */
    async sendHydrationReminder(): Promise<NotificationResult[]> {
        const settings = storageService.loadUserSettings();
        const todayKey = new Date().toISOString().split('T')[0];
        const currentIntake = storageService.getDailyTotal(todayKey);
        const goalIntake = storageService.loadDailyGoal();

        return this.sendNotification({
            title: 'Hora de se hidratar! 💧',
            body: 'Lembre-se de beber água para manter sua saúde em dia.',
            sendPush: settings.notifications ?? false,
            data: {
                currentIntake: currentIntake.toString(),
                goalIntake: goalIntake.toString()
            }
        });
    }

    /**
     * Envia resumo diário
     */
    async sendDailySummary(totalIntake: number, goalIntake: number, streak: number): Promise<NotificationResult[]> {
        const settings = storageService.loadUserSettings();
        const percentage = Math.round((totalIntake / goalIntake) * 100);

        return this.sendNotification({
            title: '📊 Seu resumo de hidratação do dia',
            body: `Você consumiu ${totalIntake}ml de ${goalIntake}ml (${percentage}%)`,
            sendPush: settings.notifications ?? false,
            data: {
                totalIntake: totalIntake.toString(),
                goalIntake: goalIntake.toString(),
                percentage: percentage.toString(),
                streak: streak.toString()
            }
        });
    }

    /**
     * Envia notificação de conquista
     */
    async sendAchievement(achievementName: string, achievementDescription: string): Promise<NotificationResult[]> {
        const settings = storageService.loadUserSettings();

        return this.sendNotification({
            title: '🏆 Parabéns! Nova conquista',
            body: `Você desbloqueou: ${achievementName}`,
            sendPush: settings.notifications ?? false,
            data: {
                achievementName,
                achievementDescription
            }
        });
    }

    /**
     * Obtém histórico combinado de notificações
     */
    getCombinedHistory(limit: number = 10): any[] {
        const pushHistory = notificationService.getNotificationHistory(limit);
        return pushHistory;
    }

    /**
     * Testa sistema de notificações (envia notificação de teste)
     */
    async testNotifications(): Promise<{
        push: NotificationResult;
    }> {
        notificationLogger.info('Running notification test', undefined, 'UnifiedService');

        const results = await this.sendNotification({
            title: 'Teste de Notificação 🔔',
            body: 'Esta é uma notificação de teste do Hydropush. Se você recebeu isso, tudo está funcionando!',
            sendPush: true
        });

        const push = results.find(r => r.type === 'push') || {
            success: false,
            type: 'push' as NotificationType,
            error: 'Push notification not sent'
        };

        return { push };
    }
}

export const unifiedNotificationService = new UnifiedNotificationService();
