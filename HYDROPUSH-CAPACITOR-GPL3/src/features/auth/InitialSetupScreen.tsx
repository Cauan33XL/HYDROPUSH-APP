import React, { useState } from 'react';
import { User, Weight, Ruler, Users, Target, ArrowRight, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Card } from '../../shared/components/ui/card';
import { storageService } from '../../core/services/StorageService';
import { criticalFlagsService } from '../../core/services/CriticalFlagsService';
import hydropushLogo from '../../assets/Hydropush.png';

interface SetupData {
  name: string;
  heightCm: string;
  weightKg: string;
  sex: 'Masculino' | 'Feminino' | 'Prefiro não responder';
  dailyGoalMl: number;
  wakeTime: string;
  sleepTime: string;
}

interface InitialSetupScreenProps {
  onComplete: (userData: SetupData) => void;
  error?: string;
}

export function InitialSetupScreen({ onComplete, error: externalError }: InitialSetupScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCancel, setShowCancel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [formData, setFormData] = useState<SetupData>({
    name: '',
    heightCm: '',
    weightKg: '',
    sex: 'Masculino',
    dailyGoalMl: 0,
    wakeTime: '07:00',
    sleepTime: '23:00'
  });

  // Combinar erros externos e locais
  const error = externalError || localError;

  const steps = [
    {
      title: 'Bem-vindo ao Hydropush!',
      subtitle: 'Vamos configurar seu perfil para uma experiência personalizada',
      fields: ['name']
    },
    {
      title: 'Informações Físicas',
      subtitle: 'Estes dados nos ajudam a calcular sua meta de hidratação',
      fields: ['heightCm', 'weightKg', 'sex']
    },
    {
      title: 'Rotina Diária',
      subtitle: 'Nos ajude a personalizar seus lembretes de hidratação',
      fields: ['wakeTime', 'sleepTime']
    },
    {
      title: 'Meta de Hidratação',
      subtitle: 'Defina sua meta diária de consumo de água',
      fields: ['dailyGoalMl']
    }
  ];

  const clearErrors = () => {
    setLocalError('');
  };

  const handleNext = async () => {
    clearErrors();

    if (!isStepValid()) {
      setLocalError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    clearErrors();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Keyboard handler for Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && isStepValid()) {
      e.preventDefault();
      handleNext();
    }
  };

  const handleCancel = () => {
    setShowCancel(true);
    // Resetar formData para valores zerados
    setFormData({
      name: '',
      heightCm: '',
      weightKg: '',
      sex: 'Masculino',
      dailyGoalMl: 0,
      wakeTime: '07:00',
      sleepTime: '23:00'
    });
    setTimeout(() => setShowCancel(false), 200);
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      clearErrors();

      // Salvar dados no storageService
      const dailyGoal = formData.dailyGoalMl || calculateSuggestedGoal();

      // ✅ CRÍTICO: Salvar no SOURCE OF TRUTH (Preferences) PRIMEIRO
      console.log('[InitialSetupScreen] 💾 Saving setup completion to Preferences...');
      await criticalFlagsService.setInitialSetupCompleted(true);
      console.log('[InitialSetupScreen] ✅ Setup flag saved to Preferences');

      // Salvar meta diária
      storageService.saveDailyGoal(dailyGoal);

      // Salvar configurações do usuário
      const userSettings = storageService.loadUserSettings();
      storageService.saveUserSettings({
        ...userSettings,
        quietHours: {
          start: formData.sleepTime,
          end: formData.wakeTime
        }
      });

      // Também marcar no StorageService (backward compatibility)
      storageService.markInitialSetupCompleted();

      // Chamar callback com dados completos
      onComplete({
        ...formData,
        dailyGoalMl: dailyGoal
      });

    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setLocalError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = () => {
    const currentFields = steps[currentStep].fields;
    return currentFields.every(field => {
      const value = formData[field as keyof SetupData];
      if (field === 'name') return typeof value === 'string' && value.trim().length >= 2;
      if (field === 'heightCm') {
        const height = parseInt(value as string);
        return value && height >= 30 && height <= 272; // Limite de segurança
      }
      if (field === 'weightKg') {
        const weight = parseInt(value as string);
        return value && weight >= 20 && weight <= 600; // Limite de segurança
      }
      if (field === 'dailyGoalMl') {
        return value && typeof value === 'number' && value > 0 && value <= 10000; // Máximo 10L
      }
      if (field === 'wakeTime' || field === 'sleepTime') {
        return value && typeof value === 'string' && value.length > 0;
      }
      return true;
    });
  };

  const calculateSuggestedGoal = () => {
    const weight = parseInt(formData.weightKg);
    if (!weight) return 2000;

    // Fórmula baseada apenas no peso: 35ml por kg
    const suggested = weight * 35;
    return Math.min(suggested, 10000); // Máximo 10L
  };

  const setSuggestedGoal = () => {
    const suggested = calculateSuggestedGoal();
    setFormData(prev => ({ ...prev, dailyGoalMl: suggested }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <img
                src={hydropushLogo}
                alt="Hydropush Logo"
                className="w-44 h-44 mx-auto mb-6 object-contain"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Qual é o seu nome?
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Digite seu nome"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    clearErrors();
                  }}
                  onKeyDown={handleKeyPress}
                  className="pl-10"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Como você gostaria de ser chamado no app
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Altura (cm)
                </label>
                <div className="relative">
                  <Ruler size={16} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Ex: 170"
                    value={formData.heightCm}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, heightCm: e.target.value }));
                      clearErrors();
                    }}
                    onKeyDown={handleKeyPress}
                    className="pl-10"
                    min="30"
                    max="272"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Máx. 272 cm
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Peso (kg)
                </label>
                <div className="relative">
                  <Weight size={16} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Ex: 70"
                    value={formData.weightKg}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, weightKg: e.target.value }));
                      clearErrors();
                    }}
                    onKeyDown={handleKeyPress}
                    className="pl-10"
                    min="20"
                    max="300"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Máx. 300kg
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sexo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'Masculino', label: 'Masculino' },
                  { value: 'Feminino', label: 'Feminino' },
                  { value: 'Prefiro não responder', label: 'Prefiro não responder' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, sex: option.value as SetupData['sex'] }));
                      clearErrors();
                    }}
                    className={`p-3 rounded-lg border-2 transition-all ${formData.sex === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:border-primary/50'
                      }`}
                    disabled={isLoading}
                  >
                    <Users size={16} className="mx-auto mb-1" />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Horário de Acordar
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="time"
                    value={formData.wakeTime}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, wakeTime: e.target.value }));
                      clearErrors();
                    }}
                    onKeyDown={handleKeyPress}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Para personalizar lembretes
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Horário de Dormir
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="time"
                    value={formData.sleepTime}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, sleepTime: e.target.value }));
                      clearErrors();
                    }}
                    onKeyDown={handleKeyPress}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Para otimizar hidratação
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 Usamos estes horários para sugerir o melhor momento para beber água
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Meta Diária (ml)
              </label>
              <div className="relative">
                <Target size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Ex: 2000"
                  value={formData.dailyGoalMl || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (value <= 10000) { // Máximo 10L
                      setFormData(prev => ({ ...prev, dailyGoalMl: value }));
                    }
                    clearErrors();
                  }}
                  onKeyDown={handleKeyPress}
                  className="pl-10"
                  min="0"
                  max="10000"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Máximo: 10L (10.000ml)
              </p>
            </div>

            {formData.weightKg && (
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={setSuggestedGoal}
                  className="w-full border-primary text-primary hover:bg-primary/10"
                  disabled={isLoading}
                >
                  <Target size={16} className="mr-2" />
                  Sugerir Meta Baseada no Peso
                </Button>

                <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Target size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Meta Sugerida</p>
                      <p className="text-sm text-muted-foreground">
                        {(calculateSuggestedGoal() / 1000).toFixed(1)}L por dia baseado no seu peso
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {formData.dailyGoalMl > 10000 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Limite máximo 10 L — excede limite seguro do app
                </p>
              </div>
            )}

            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                💡 Não substitui orientação médica
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-background via-blue-50/30 to-cyan-50/30 dark:from-background dark:via-blue-950/20 dark:to-cyan-950/20 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10 flex flex-col max-h-[100dvh] overflow-y-auto"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6"
          >
            <div className="text-center text-destructive text-sm">
              {error}
            </div>
          </motion.div>
        )}

        {/* Glass Effect Card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-500/10 mb-4">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs text-muted-foreground mb-3">
              <motion.span
                key={currentStep}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-medium"
              >
                Etapa {currentStep + 1} de {steps.length}
              </motion.span>
              <motion.span
                key={`${currentStep}-progress`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-medium text-primary"
              >
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </motion.span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full shadow-lg shadow-primary/30"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3"
              key={`title-${currentStep}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {steps[currentStep].title}
            </motion.h1>
            <motion.p
              className="text-muted-foreground"
              key={`subtitle-${currentStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {steps[currentStep].subtitle}
            </motion.p>
          </div>

          {/* Form */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderStep()}
          </motion.div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pb-safe">
            {currentStep > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full sm:w-auto"
              >
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="w-full sm:w-auto px-6 bg-muted/50 backdrop-blur-sm border-border/50 hover:bg-muted/80"
                  disabled={isLoading}
                >
                  Voltar
                </Button>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full sm:w-auto"
            >
              <Button
                variant="outline"
                onClick={handleCancel}
                className={`w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-all ${showCancel ? 'bg-red-500 text-white' : ''
                  }`}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </motion.div>

            <motion.div
              className="flex-1 w-full sm:w-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                onClick={handleNext}
                disabled={!isStepValid() || isLoading}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/30 disabled:opacity-50 disabled:shadow-none"
              >
                {isLoading ? (
                  'Salvando...'
                ) : currentStep === steps.length - 1 ? (
                  <>
                    Confirmar
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ArrowRight size={16} className="ml-2" />
                    </motion.div>
                  </>
                ) : (
                  <>
                    Continuar
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ArrowRight size={16} className="ml-2" />
                    </motion.div>
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Data info */}
          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-xs text-muted-foreground/80 bg-muted/30 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
              🔒 Dados salvos localmente no seu dispositivo
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}