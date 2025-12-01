import React, { useState } from 'react';
import { Bell, Moon, Sun, Check, Droplets } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../../shared/components/ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { storageService } from '../../core/services/StorageService';
import { criticalFlagsService } from '../../core/services/CriticalFlagsService';
import { capacitorService } from '../../core/services/CapacitorService';

interface OnboardingScreenProps {
  onComplete: () => void;
  error?: string;
}

export function OnboardingScreen({ onComplete, error: externalError }: OnboardingScreenProps) {
  const { theme, setTheme } = useTheme();
  const [step, setStep] = useState(1);
  const [notifications, setNotifications] = useState(false); // ✅ Sempre começa false - só muda com ação do usuário

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Removido o useEffect que carregava do storage - isso causava o bug!

  const handleNotificationPermission = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Tentar permissão nativa via CapacitorService
      const granted = await capacitorService.requestPushPermissions();

      // Fallback para API web se não for nativo ou se falhar
      if (!granted && !capacitorService.isNativePlatform() && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotifications(permission === 'granted');
      } else {
        setNotifications(granted);
      }

      // Salvar preferência no storageService
      storageService.saveUserSettings({
        notifications: granted
      });

    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      setError('Não foi possível configurar notificações.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    try {
      setTheme(newTheme);
      // O ThemeContext já salva automaticamente no storageService
    } catch (err) {
      console.error('Erro ao alterar tema:', err);
      setError('Erro ao alterar tema.');
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      setError(null);



      // ✅ CRÍTICO: Salvar no SOURCE OF TRUTH (Preferences) PRIMEIRO
      console.log('[OnboardingScreen] 💾 Saving onboarding completion to Preferences...');
      await criticalFlagsService.setOnboardingCompleted(true);
      console.log('[OnboardingScreen] ✅ Onboarding flag saved to Preferences');

      // Também salvar no StorageService (backward compatibility)
      storageService.markOnboardingCompleted();

      // Disparar evento para notificar outros componentes
      window.dispatchEvent(new CustomEvent('onboardingCompleted'));

      // Chamar callback de conclusão
      onComplete();

    } catch (err) {
      console.error('Erro ao completar onboarding:', err);
      setError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDailyGoal = () => {
    try {
      return storageService.loadDailyGoal();
    } catch (err) {
      console.error('Erro ao carregar meta diária:', err);
      return 2000; // Meta padrão
    }
  };

  const dailyGoal = getDailyGoal();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-md text-center px-4 sm:px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Error Display */}
        {(error || externalError) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6"
          >
            <div className="text-center text-destructive text-sm">
              {error || externalError}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <>
            {/* Goal Confirmation */}
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Droplets size={32} className="text-white" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-foreground mb-2"
              >
                Sua meta está pronta!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground"
              >
                Calculamos sua meta diária baseada no seu perfil
              </motion.p>
            </div>

            {/* Goal Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 sm:p-6 mb-8"
            >
              <div className="text-4xl font-bold text-primary mb-2">
                {(dailyGoal / 1000).toFixed(1)}L
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                Meta diária recomendada
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  💡 Baseado em 35ml por kg do seu peso
                  <br />
                  Você pode ajustar isso a qualquer momento nas configurações
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={() => setStep(2)}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                Continuar
              </Button>
            </motion.div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Theme Selection */}
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                {theme === 'dark' ? (
                  <Moon size={32} className="text-white" />
                ) : (
                  <Sun size={32} className="text-white" />
                )}
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-foreground mb-2"
              >
                Escolha seu tema
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground"
              >
                Selecione a aparência que mais combina com você
              </motion.p>
            </div>

            {/* Theme Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
            >
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-stretch ${theme === 'light'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background hover:bg-muted'
                  }`}
                disabled={isLoading}
              >
                <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                  <div className="w-full h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-2"></div>
                  <div className="space-y-1">
                    <div className="w-3/4 h-2 bg-gray-300 rounded"></div>
                    <div className="w-1/2 h-2 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Sun size={16} className="text-yellow-500" />
                  <span className="font-medium">Claro</span>
                  {theme === 'light' && <Check size={16} className="text-primary" />}
                </div>
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-2xl border-2 transition-all ${theme === 'dark'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background hover:bg-muted'
                  }`}
                disabled={isLoading}
              >
                <div className="bg-gray-900 rounded-lg p-3 mb-3">
                  <div className="w-full h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-2"></div>
                  <div className="space-y-1">
                    <div className="w-3/4 h-2 bg-gray-600 rounded"></div>
                    <div className="w-1/2 h-2 bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Moon size={16} className="text-blue-400" />
                  <span className="font-medium">Escuro</span>
                  {theme === 'dark' && <Check size={16} className="text-primary" />}
                </div>
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={() => setStep(3)}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                Continuar
              </Button>
            </motion.div>
          </>
        )}

        {step === 3 && (
          <>
            {/* Notifications */}
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Bell size={32} className="text-white" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-foreground mb-2"
              >
                Lembretes de hidratação
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground"
              >
                Receba notificações para não esquecer de beber água
              </motion.p>
            </div>

            {/* Notification Setting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6 mb-8"
            >
              <div className="mb-4">
                <div className="font-medium text-foreground">
                  Ativar Notificações
                </div>
                <div className="text-sm text-muted-foreground">
                  Lembretes personalizados ao longo do dia
                </div>
              </div>

              <Button
                onClick={handleNotificationPermission}
                className="w-full bg-primary hover:bg-primary/90 mb-4"
                disabled={isLoading || notifications}
              >
                {isLoading ? 'Solicitando...' : 'Permitir Notificações'}
              </Button>

              {notifications && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Check size={16} />
                    <span className="text-sm font-medium">
                      Notificações ativadas!
                    </span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Você receberá lembretes gentis para se manter hidratado
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Sample Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-left mb-8"
            >
              <p className="text-sm text-muted-foreground mb-3">
                Exemplos de lembretes que você receberá:
              </p>
              <div className="space-y-2">
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  💧 "Hora de beber água — seu corpo agradece!"
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  🎯 "Que tal +200ml agora? Você está indo bem!"
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  🎉 "Meta alcançada! Parabéns pela consistência!"
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                onClick={handleComplete}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                Finalizar
              </Button>
            </motion.div>
          </>
        )}



        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-2 mt-8"
        >
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`w-2 h-2 rounded-full transition-all ${step >= num ? 'bg-primary' : 'bg-muted'
                }`}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}