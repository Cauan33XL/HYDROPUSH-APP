import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Switch } from '../../shared/components/ui/switch';
import { Button } from '../../shared/components/ui/button';
import { storageService } from '../../core/services/StorageService';
import { notificationService } from '../../core/services/NotificationService';
import { useNotificationScheduler } from '../../shared/hooks/useNotificationScheduler';
import { NotificationServiceStatus } from './NotificationServiceStatus';

interface NotificationSettingsProps {
  onSettingsChange?: (settings: NotificationPreferences) => void;
}

interface NotificationPreferences {
  pushNotifications: boolean;
  smartReminders: boolean;
  permission: 'granted' | 'denied' | 'default';
}

// Helper function to format interval text dynamically
function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  const hours = minutes / 60;
  if (hours === 1) return '1 hora';
  if (hours % 1 === 0) return `${hours} horas`;
  return `${hours.toFixed(1).replace('.', ',')} hora${hours > 1.5 ? 's' : ''}`;
}

const reminderIntervals = [
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1,5 hora' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' }
];

export function NotificationSettings({ onSettingsChange }: NotificationSettingsProps) {
  const { scheduleHydrationReminders, cancelAllReminders } = useNotificationScheduler();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    pushNotifications: false,
    smartReminders: false,
    permission: 'default'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Reminder Settings State
  const [reminderInterval, setReminderInterval] = useState<number>(120);
  const [quietHours, setQuietHours] = useState({ start: '22:00', end: '07:00' });
  const [weekendReminders, setWeekendReminders] = useState(true);

  // UI State
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);
  const [showQuietHours, setShowQuietHours] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Carregar preferências do storageService
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Carregar configurações do usuário
        const userSettings = storageService.loadUserSettings();

        // Verificar permissão usando o serviço de notificações
        const browserPermission = await notificationService.checkPermissions();

        // Mapear configurações do storageService para o estado local
        const loadedPreferences: NotificationPreferences = {
          pushNotifications: userSettings.notifications,
          smartReminders: userSettings.smartReminders,
          permission: browserPermission
        };

        setReminderInterval(userSettings.reminderInterval || 120);
        setQuietHours(userSettings.quietHours || { start: '22:00', end: '07:00' });
        setWeekendReminders(userSettings.weekendReminders ?? true);

        setPreferences(loadedPreferences);
        onSettingsChange?.(loadedPreferences);

      } catch (err) {
        console.error('Erro ao carregar preferências:', err);
        setError('Erro ao carregar configurações de notificação');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [onSettingsChange]);

  const requestPermission = async () => {
    if (!notificationService.isSupported()) {
      setError('Notificações não são suportadas neste dispositivo');
      return;
    }

    try {
      setError(null);
      const permission = await notificationService.requestPermission();

      const newPushNotifications = permission === 'granted';

      // Atualizar estado local
      const newPrefs: NotificationPreferences = {
        ...preferences,
        permission: permission,
        pushNotifications: newPushNotifications
      };

      setPreferences(newPrefs);

      // Salvar no storageService
      storageService.saveUserSettings({
        notifications: newPushNotifications,
        smartReminders: newPrefs.smartReminders
      });

      onSettingsChange?.(newPrefs);

      // Mostrar notificação de teste se permitido
      if (permission === 'granted') {
        try {
          await notificationService.showNotification({
            title: 'Hydropush - Notificações Ativadas',
            body: 'Agora você receberá lembretes para manter sua hidratação em dia! 💧',
            icon: '/favicon.ico',
            tag: 'hydration-reminder'
          });
        } catch {
          console.log('Notificação de teste não pôde ser exibida');
        }
      }

    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      setError('Erro ao ativar notificações. Tente novamente.');
    }
  };

  // Helper para salvar e reagendar
  const saveAndReschedule = async (updates: Partial<any>) => {
    try {
      // 1. Salvar no storage
      storageService.saveUserSettings(updates);

      // 2. Reagendar se notificações estiverem ativas
      if (preferences.pushNotifications && preferences.permission === 'granted') {
        await updateNotificationSchedule(true);
      }
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
    }
  };

  const toggleSetting = async (key: 'pushNotifications' | 'smartReminders', checked: boolean) => {
    try {
      setError(null);

      // Se tentando ativar pushNotifications
      if (key === 'pushNotifications' && checked) {
        // Se não tem permissão, solicitar
        if (preferences.permission !== 'granted') {
          await requestPermission();
          return;
        }
      }

      const newPrefs: NotificationPreferences = {
        ...preferences,
        [key]: checked
      };

      // Sincronizar smartReminders com pushNotifications (fusão das configurações)
      if (key === 'pushNotifications') {
        newPrefs.smartReminders = checked;
      }

      setPreferences(newPrefs);

      // Salvar no storageService
      storageService.saveUserSettings({
        notifications: newPrefs.pushNotifications,
        smartReminders: newPrefs.smartReminders
      });

      onSettingsChange?.(newPrefs);

      // 🔔 Disparar evento customizado para reagendar notificações
      await updateNotificationSchedule(newPrefs.pushNotifications);

    } catch (err) {
      console.error('Erro ao alterar configuração:', err);
      setError('Erro ao salvar configuração. Tente novamente.');
    }
  };

  // 🔔 Função para atualizar agendamento de notificações
  const updateNotificationSchedule = async (enabled: boolean) => {
    try {
      const settings = storageService.loadUserSettings();

      if (enabled) {
        await scheduleHydrationReminders({
          enabled: settings.notifications,
          interval: settings.reminderInterval,
          quietHoursStart: settings.quietHours.start,
          quietHoursEnd: settings.quietHours.end,
          weekendReminders: settings.weekendReminders,
          smartReminders: settings.smartReminders,
          forceReschedule: true
        });
      } else {
        await cancelAllReminders();
      }

      // Disparar evento para MainApp
      window.dispatchEvent(new CustomEvent('notificationSettingsChanged', {
        detail: settings
      }));
    } catch (err) {
      console.error('Erro ao atualizar agendamento:', err);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        className="bg-card rounded-2xl shadow-sm border border-border p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-muted-foreground">Carregando...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-card rounded-2xl shadow-sm border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Bell size={16} className="text-[#1E88E5]" />
          </div>
          <h3 className="font-semibold text-foreground">Notificações</h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status dos Serviços */}
        <NotificationServiceStatus className="mb-6" />

        {/* Mensagem de erro */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm"
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Notificações Push (Fusão) */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium text-foreground">Notificações Push</p>
            <p className="text-sm text-muted-foreground">
              Receber lembretes de hidratação
            </p>
          </div>
          <Switch
            checked={preferences.pushNotifications && preferences.permission === 'granted'}
            onCheckedChange={(checked) => toggleSetting('pushNotifications', checked)}
            disabled={preferences.permission === 'denied'}
          />
        </div>

        {/* Configurações Avançadas de Lembrete (Só exibe se ativado) */}
        {preferences.pushNotifications && preferences.permission === 'granted' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pt-4 border-t border-border"
          >
            {/* Fim de Semana */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">Lembretes no Final de Semana</p>
                <p className="text-xs text-muted-foreground">Sábado e Domingo</p>
              </div>
              <Switch
                checked={weekendReminders}
                onCheckedChange={(checked) => {
                  setWeekendReminders(checked);
                  saveAndReschedule({ weekendReminders: checked });
                }}
              />
            </div>

            {/* Intervalo */}
            <div>
              <button
                className="w-full flex items-center justify-between p-0 text-left rounded-lg group"
                onClick={() => setShowIntervalPicker(!showIntervalPicker)}
              >
                <div>
                  <p className="font-medium text-foreground text-sm">Intervalo entre Lembretes</p>
                  <p className="text-xs text-muted-foreground">
                    {reminderIntervals.find(i => i.value === reminderInterval)?.label}
                  </p>
                </div>
                <ChevronRight size={16} className={`text-muted-foreground transition-transform ${showIntervalPicker ? 'rotate-90' : ''}`} />
              </button>

              {showIntervalPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pl-4 space-y-1 mt-2"
                >
                  {reminderIntervals.map((interval) => (
                    <button
                      key={interval.value}
                      onClick={() => {
                        setReminderInterval(interval.value);
                        saveAndReschedule({ reminderInterval: interval.value });
                        setShowIntervalPicker(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${reminderInterval === interval.value
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-[#1E88E5]'
                        : 'hover:bg-muted/50 text-muted-foreground'
                        }`}
                    >
                      {interval.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Horário Silencioso */}
            <div>
              <button
                className="w-full flex items-center justify-between p-0 text-left rounded-lg group"
                onClick={() => setShowQuietHours(!showQuietHours)}
              >
                <div>
                  <p className="font-medium text-foreground text-sm">Horário Silencioso</p>
                  <p className="text-xs text-muted-foreground">
                    {quietHours.start} - {quietHours.end}
                  </p>
                </div>
                <ChevronRight size={16} className={`text-muted-foreground transition-transform ${showQuietHours ? 'rotate-90' : ''}`} />
              </button>

              {showQuietHours && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pl-4 bg-muted/30 p-3 rounded-lg mt-2"
                >
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Início
                      </label>
                      <input
                        type="time"
                        value={quietHours.start}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          setQuietHours(prev => ({ ...prev, start: newStart }));
                          saveAndReschedule({ quietHours: { ...quietHours, start: newStart } });
                        }}
                        className="w-full p-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E88E5] bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Fim
                      </label>
                      <input
                        type="time"
                        value={quietHours.end}
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          setQuietHours(prev => ({ ...prev, end: newEnd }));
                          saveAndReschedule({ quietHours: { ...quietHours, end: newEnd } });
                        }}
                        className="w-full p-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E88E5] bg-background text-foreground"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Não enviar lembretes neste período
                  </p>
                </motion.div>
              )}
            </div>

          </motion.div>
        )}

        {/* Action Button */}
        {preferences.permission === 'default' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={requestPermission}
              className="w-full bg-[#1E88E5] hover:bg-[#1565C0]"
            >
              <Bell size={16} className="mr-2" />
              Ativar Notificações
            </Button>
          </motion.div>
        )}

        {/* Status final */}
        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
          {preferences.permission === 'granted' && preferences.pushNotifications ? (
            <div className="space-y-1">
              <p className="text-green-600 dark:text-green-400 font-medium">
                ✅ Notificações ativas
              </p>
              <p>
                Lembretes a cada {formatInterval(reminderInterval)}
                {weekendReminders ? ' (incluindo fins de semana)' : ''}
              </p>
            </div>
          ) : preferences.permission === 'denied' ? (
            <div className="space-y-1">
              <p className="text-red-600 dark:text-red-400 font-medium">
                ❌ Notificações bloqueadas
              </p>
              <p>Use "Ajustar" para alterar as permissões no navegador</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                💡 Notificações disponíveis
              </p>
              <p>Ative as notificações para receber lembretes de hidratação</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}