import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { useAuth } from '../../contexts/AuthContext';
import hydropushLogo from '../../assets/Hydropush.png';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  error?: string;
  onError: (error: string) => void;
}

export function LoginScreen({ 
  onSwitchToRegister, 
  onForgotPassword, 
  error: externalError,
  onError 
}: LoginScreenProps) {
  const { login, loginAsGuest, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Combinar erros externos e locais
  const error = externalError || localError;

  const clearErrors = () => {
    setLocalError('');
    onError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!formData.email || !formData.password) {
      setLocalError('Por favor, preencha todos os campos');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      const success = await login(formData.email, formData.password);
      if (!success) {
        const errorMsg = 'Email ou senha incorretos';
        setLocalError(errorMsg);
        onError(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao fazer login';
      console.error('Erro no login:', err);
      setLocalError(errorMsg);
      onError(errorMsg);
    }
  };

  const handleDefaultLogin = async () => {
    clearErrors();
    
    try {
      const success = await login('hydrody123@gmail.com', 'hydropush123');
      if (!success) {
        const errorMsg = 'Erro ao fazer login com conta padrão';
        setLocalError(errorMsg);
        onError(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao fazer login padrão';
      console.error('Erro no login padrão:', err);
      setLocalError(errorMsg);
      onError(errorMsg);
    }
  };

  const handleGuestLogin = async () => {
    clearErrors();

    try {
      await loginAsGuest();
    } catch (err) {
      const errorMsg = 'Erro ao entrar como convidado';
      console.error('Erro no login convidado:', err);
      setLocalError(errorMsg);
      onError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.img 
            src={hydropushLogo} 
            alt="Hydropush Logo" 
            className="w-32 h-32 mx-auto mb-4 object-contain"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          />
          <motion.h1 
            className="text-2xl font-bold text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Entrar
          </motion.h1>
          <motion.p 
            className="text-muted-foreground mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Faça login para continuar
          </motion.p>
        </div>

        {/* Login Form */}
        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email ou usuário"
                value={formData.email}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  clearErrors();
                }}
                className="pl-10"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                value={formData.password}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, password: e.target.value }));
                  clearErrors();
                }}
                className="pl-10 pr-10"
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground rounded-md"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              className="bg-destructive/10 border border-destructive rounded-lg p-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-center text-destructive text-sm">{error}</div>
            </motion.div>
          )}

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </motion.form>

        {/* Alternative Login Options */}
        <motion.div 
          className="mt-6 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleDefaultLogin}
            className="w-full"
            disabled={isLoading}
          >
            <User size={16} className="mr-2" />
            Entrar com conta padrão
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleGuestLogin}
            className="w-full"
            disabled={isLoading}
          >
            <User size={16} className="mr-2" />
            Entrar como convidado
          </Button>
        </motion.div>

        {/* Footer Links */}
        <motion.div 
          className="mt-8 text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <button
            type="button"
            onClick={() => {
              onForgotPassword();
              clearErrors();
            }}
            className="text-primary hover:underline text-sm rounded-md"
            disabled={isLoading}
          >
            Esqueci minha senha
          </button>

          <div className="text-muted-foreground text-sm">
            Não tem conta?{' '}
            <button
              type="button"
              onClick={() => {
                onSwitchToRegister();
                clearErrors();
              }}
              className="text-primary hover:underline font-medium rounded-md"
              disabled={isLoading}
            >
              Criar conta
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}