import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Weight, Calendar, UserCheck, Ruler } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { storageService } from '../../core/services/StorageService';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: () => void;
  error?: string;
  onError: (error: string) => void;
}

// Mapeamento entre os valores do formulário e os valores esperados pelo AuthContext
const SEX_MAPPING = {
  'M': 'Masculino',
  'F': 'Feminino', 
  'Outro': 'Prefiro não responder'
} as const;

type FormSex = keyof typeof SEX_MAPPING;

export function RegisterScreen({ 
  onSwitchToLogin, 
  onRegisterSuccess, 
  error: externalError,
  onError 
}: RegisterScreenProps) {
  const { register, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    weightKg: '',
    heightCm: '',
    age: '',
    sex: 'M' as FormSex
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Combinar erros externos e locais
  const error = externalError || localError;

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setLocalError('Nome é obrigatório');
      return false;
    }
    if (formData.password.length < 6) {
      setLocalError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setLocalError('As senhas não coincidem');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setLocalError('Email inválido');
      return false;
    }
    setLocalError('');
    onError('');
    return true;
  };

  const validateStep2 = () => {
    const weight = parseFloat(formData.weightKg);
    const height = parseFloat(formData.heightCm);
    const age = parseInt(formData.age);

    if (!weight || weight < 30 || weight > 300) {
      setLocalError('Peso deve estar entre 30 e 300 kg');
      return false;
    }
    if (!height || height < 100 || height > 250) {
      setLocalError('Altura deve estar entre 100 e 250 cm');
      return false;
    }
    if (!age || age < 12 || age > 100) {
      setLocalError('Idade deve estar entre 12 e 100 anos');
      return false;
    }
    setLocalError('');
    onError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  // Função para converter os dados do formulário para o formato do AuthContext
  const prepareRegisterData = () => {
    const calculatedGoal = calculateGoal();
    
    return {
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      password: formData.password,
      weightKg: parseFloat(formData.weightKg),
      heightCm: parseFloat(formData.heightCm),
      age: parseInt(formData.age),
      sex: SEX_MAPPING[formData.sex], // Convertemos usando o mapeamento
      dailyGoalMl: calculatedGoal
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    onError('');

    if (!validateStep2()) return;

    try {
      const registerData = prepareRegisterData();

      // Salvar meta diária no storageService
      storageService.saveDailyGoal(registerData.dailyGoalMl);

      const success = await register(registerData);
      if (success) {
        // Salvar configurações iniciais do usuário
        const userSettings = storageService.loadUserSettings();
        storageService.saveUserSettings({
          ...userSettings,
          // Configurações padrão para novo usuário
        });

        onRegisterSuccess();
      } else {
        const errorMsg = 'Erro ao criar conta. Tente novamente.';
        setLocalError(errorMsg);
        onError(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao criar conta.';
      console.error('Erro no registro:', err);
      setLocalError(errorMsg);
      onError(errorMsg);
    }
  };

  const calculateGoal = () => {
    const weight = parseFloat(formData.weightKg);
    if (weight) {
      return Math.round(weight * 35);
    }
    return 2000; // Meta padrão
  };

  const clearErrors = () => {
    setLocalError('');
    onError('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-sm bg-card rounded-2xl shadow-lg border border-border p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-2xl">💧</div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {step === 1 ? 'Criar Conta' : 'Seu Perfil'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {step === 1
              ? 'Preencha seus dados para começar'
              : 'Complete seu perfil para calcular sua meta'
            }
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`w-3 h-3 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-12 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-3 h-3 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
            <div>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nome completo"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    clearErrors();
                  }}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email (opcional)"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    clearErrors();
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Eye size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha (mín. 6 caracteres)"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, password: e.target.value }));
                    clearErrors();
                  }}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground rounded-md"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <div className="relative">
                <UserCheck size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirmar senha"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                    clearErrors();
                  }}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <span className="font-medium">Seus dados ficam armazenados apenas no seu dispositivo</span>
                <br />
                <span className="text-blue-700 dark:text-blue-300">
                  Garantindo total privacidade e segurança.
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
                <div className="text-center text-destructive text-sm">{error}</div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              Próximo
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="relative">
                  <Weight size={16} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Peso (kg)"
                    value={formData.weightKg}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, weightKg: e.target.value }));
                      clearErrors();
                    }}
                    className="pl-10"
                    min="30"
                    max="300"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Ruler size={16} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Altura (cm)"
                    value={formData.heightCm}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, heightCm: e.target.value }));
                      clearErrors();
                    }}
                    className="pl-10"
                    min="100"
                    max="250"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Idade"
                  value={formData.age}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, age: e.target.value }));
                    clearErrors();
                  }}
                  className="pl-10"
                  min="12"
                  max="100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sexo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'M', label: 'Masculino' },
                  { value: 'F', label: 'Feminino' },
                  { value: 'Outro', label: 'Prefiro não responder' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, sex: value as FormSex }));
                      clearErrors();
                    }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.sex === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background hover:bg-muted'
                    }`}
                  >
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Preview */}
            {formData.weightKg && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {(calculateGoal() / 1000).toFixed(1)}L
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Meta diária sugerida
                  </div>
                  <div className="text-xs text-green-500 dark:text-green-500 mt-1">
                    Baseado em 35ml por kg (você pode ajustar depois)
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
                <div className="text-center text-destructive text-sm">{error}</div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep(1);
                  clearErrors();
                }}
                className="flex-1"
                disabled={isLoading}
              >
                Voltar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? 'Criando...' : 'Criar Conta'}
              </Button>
            </div>
          </form>
        )}

        {/* Footer */}
            <div className="mt-8 text-center">
          <div className="text-muted-foreground text-sm">
            Já tem conta?{' '}
            <button
              type="button"
              onClick={() => {
                onSwitchToLogin();
                clearErrors();
              }}
              className="text-primary hover:underline font-medium rounded-md"
            >
              Fazer login
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}