import { useEffect, useCallback } from 'react';
import { notificationService, ScheduledNotification } from '../../core/services/NotificationService';
import { storageService } from '../../core/services/StorageService';

export interface ReminderSettings {
  enabled: boolean;
  interval: number; // em minutos
  quietHoursStart: string; // formato HH:MM
  quietHoursEnd: string; // formato HH:MM
  weekendReminders: boolean;
  smartReminders: boolean;
  forceReschedule?: boolean;
}

export function useNotificationScheduler() {
  // Iniciar verificação de notificações agendadas (para navegador)
  useEffect(() => {
    notificationService.startNotificationChecker();
  }, []);

  const scheduleHydrationReminders = useCallback(async (settings: ReminderSettings) => {
    try {
      console.log('🔔 [NotificationScheduler] Iniciando agendamento de notificações', { settings });

      // Verificar permissão primeiro
      const permission = await notificationService.checkPermissions();
      console.log(`🔐 [NotificationScheduler] Permission status: ${permission}`);

      if (permission !== 'granted') {
        console.warn('⚠️ [NotificationScheduler] Notificações não autorizadas. Status:', permission);
        return;
      }

      if (!settings.enabled) {
        console.log('🔕 [NotificationScheduler] Lembretes desativados');
        await notificationService.cancelAllNotifications();
        return;
      }

      // 1. Verificar se já existem notificações pendentes válidas
      const pending = await notificationService.getPendingNotifications();
      const now = new Date();

      // Filtrar apenas notificações futuras de hidratação
      const futureHydrationReminders = pending.filter(n =>
        n.scheduledTime > now &&
        n.id.startsWith('hydration_')
      );

      if (futureHydrationReminders.length > 0 && !settings.forceReschedule) {
        console.log(`✅ [NotificationScheduler] Já existem ${futureHydrationReminders.length} notificações agendadas. Mantendo cronograma atual.`);
        // Se já tem agendado, não faz nada para não resetar o timer (evita o bug de "nunca notificar se abrir o app")
        return;
      }

      // 2. Se não tem pendentes, calcular novo cronograma ancorado na última hidratação
      await notificationService.cancelAllNotifications(); // Limpa lixo antigo se houver

      const reminders: ScheduledNotification[] = [];
      const lastEntryData = storageService.getLastHydrationEntry();

      // Base para o próximo lembrete: última bebida ou agora (se nunca bebeu)
      let baseTime = lastEntryData ? new Date(`${lastEntryData.date}T${lastEntryData.entry.timestamp.split('T')[1] || '00:00:00'}`) : now;

      // Se a data parseada for inválida (fallback), usa agora
      if (isNaN(baseTime.getTime())) {
        baseTime = now;
      }

      // Calcular horários de silêncio
      const quietStart = parseInt(settings.quietHoursStart.split(':')[0]);
      const quietStartMin = parseInt(settings.quietHoursStart.split(':')[1] || '0');
      const quietEnd = parseInt(settings.quietHoursEnd.split(':')[0]);
      const quietEndMin = parseInt(settings.quietHoursEnd.split(':')[1] || '0');

      // Função para verificar se está no horário de silêncio
      const isQuietTime = (date: Date): boolean => {
        const hour = date.getHours();
        const minute = date.getMinutes();
        const currentMinutes = hour * 60 + minute;
        const quietStartMinutes = quietStart * 60 + quietStartMin;
        const quietEndMinutes = quietEnd * 60 + quietEndMin;

        if (quietStartMinutes > quietEndMinutes) {
          return currentMinutes >= quietStartMinutes || currentMinutes < quietEndMinutes;
        }
        return currentMinutes >= quietStartMinutes && currentMinutes < quietEndMinutes;
      };

      // Verificar fim de semana
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      if (isWeekend && !settings.weekendReminders) {
        console.log('📅 [NotificationScheduler] Fim de semana - lembretes desativados');
        return;
      }

      if (settings.interval > 0) {
        const intervalMs = settings.interval * 60 * 1000;

        // Calcular próximo horário alvo: Última bebida + Intervalo
        let nextReminder = new Date(baseTime.getTime() + intervalMs);

        // Se o alvo já passou (ex: bebeu há 3 horas e intervalo é 2h), agendar para o futuro próximo
        // Mas respeitando o ciclo: last + N * interval
        while (nextReminder <= now) {
          nextReminder = new Date(nextReminder.getTime() + intervalMs);
        }

        let attempts = 0;
        const maxAttempts = 48;
        const endTime = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Agendar para as próximas 24h

        while (nextReminder <= endTime && attempts < maxAttempts) {
          attempts++;

          if (isQuietTime(nextReminder)) {
            // Pular horário de silêncio
            const nextAllowedHour = (quietEnd === 0) ? 0 : quietEnd;
            nextReminder.setHours(nextAllowedHour, quietEndMin, 0, 0);
            if (nextReminder <= now) nextReminder.setDate(nextReminder.getDate() + 1);
            continue;
          }

          if (nextReminder > now) {
            reminders.push({
              id: `hydration_${nextReminder.getTime()}`,
              title: 'Hora de se hidratar! 💧',
              body: 'Mantenha o foco na sua meta diária.',
              scheduledTime: nextReminder,
              data: { type: 'hydration_reminder' }
            });
          }

          nextReminder = new Date(nextReminder.getTime() + intervalMs);
        }
      }

      // Agendar
      let successCount = 0;
      for (const reminder of reminders) {
        try {
          await notificationService.scheduleNotification(reminder);
          successCount++;
        } catch (error) {
          console.error(`❌ [NotificationScheduler] Erro ao agendar:`, error);
        }
      }

      console.log(`🎯 [NotificationScheduler] ${successCount} notificações agendadas. Próxima: ${reminders[0]?.scheduledTime.toLocaleTimeString()}`);

    } catch (error) {
      console.error('❌ [NotificationScheduler] Erro ao agendar lembretes:', error);
    }
  }, []);

  const cancelAllReminders = useCallback(async () => {
    try {
      await notificationService.cancelAllNotifications();
      console.log('Todas as notificações canceladas');
    } catch (error) {
      console.error('Erro ao cancelar notificações:', error);
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      await notificationService.showNotification({
        title: 'Teste de Notificação 🔔',
        body: 'Esta é uma notificação de teste do Hydropush',
        icon: '/favicon.ico',
        tag: 'test_notification'
      });
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
    }
  }, []);

  return {
    scheduleHydrationReminders,
    cancelAllReminders,
    sendTestNotification
  };
}