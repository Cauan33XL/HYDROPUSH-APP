import React, { createContext, useContext, useState, useEffect } from 'react';
/* eslint-disable react-refresh/only-export-components */
import { storageService } from '../core/services/StorageService';
import { criticalFlagsService } from '../core/services/CriticalFlagsService';
import type { UserSettings } from '../core/services/StorageService';

export interface User {
  id: string;
  name: string;
  email?: string;
  weightKg: number;
  heightCm: number;
  sex: 'Masculino' | 'Feminino' | 'Prefiro não responder';
  dailyGoalMl: number;
  themePref: 'light' | 'dark';
  lastLogin: string;
  level?: number;
  xp?: number;
  wakeTime?: string;
  sleepTime?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPreferencesReady: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsGuest: () => Promise<void>;
  register: (userData: RegisterData) => Promise<boolean>;
  createUserFromSetup: (setupData: SetupData) => void;
  logout: (clearData?: boolean) => void;
  updateUser: (userData: Partial<User>) => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

export interface RegisterData {
  name: string;
  email?: string;
  password: string;
  weightKg: number;
  heightCm: number;
  sex: 'Masculino' | 'Feminino' | 'Prefiro não responder';
}

export interface SetupData {
  name: string;
  heightCm: string;
  weightKg: string;
  sex: 'Masculino' | 'Feminino' | 'Prefiro não responder';
  dailyGoalMl: number;
  wakeTime: string;
  sleepTime: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Serviço de armazenamento seguro (mantido para compatibilidade com sessões)
const secureStorage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(`secure_${key}`);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(`secure_${key}`, value);
    } catch {
      console.error('Erro ao salvar dados');
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(`secure_${key}`);
    } catch {
      console.error('Erro ao remover dados');
    }
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreferencesReady, setIsPreferencesReady] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [, setSessionToken] = useState<string | null>(null);

  // Hash simples para senhas (em produção usar PBKDF2/Argon2)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'hydropush_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Verificar sessão existente - ESTADO INICIAL LIMPO
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[AuthProvider] 🔄 Starting initialization sequence...');

        // ✅ PASSO 1: Inicializar CriticalFlags PRIMEIRO (rápido, ~50ms)
        console.log('[AuthProvider] Step 1: Initializing CriticalFlags...');
        await criticalFlagsService.init();
        setIsPreferencesReady(true);
        console.log('[AuthProvider] ✅ CriticalFlags ready');

        // ✅ PASSO 2: Inicializar StorageService (pode demorar, mas não bloqueia)
        console.log('[AuthProvider] Step 2: Initializing StorageService...');
        await storageService.init();
        console.log('[AuthProvider] ✅ StorageService ready');

        // ✅ PASSO 3: Verificar sessão
        console.log('[AuthProvider] Step 3: Checking session...');
        const token = secureStorage.get('session_token');
        const userData = secureStorage.get('user_data');
        const guestData = secureStorage.get('guest_user_data');

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          // Verificar se sessão não expirou (30 dias)
          const tokenData = JSON.parse(atob(token.split('.')[1] || '{}'));
          const isExpired = tokenData.exp < Date.now() / 1000;

          if (!isExpired) {
            setUser(parsedUser);
            setSessionToken(token);
          } else {
            // Sessão expirada - LIMPAR DADOS
            secureStorage.remove('session_token');
            secureStorage.remove('user_data');
          }
        } else if (guestData) {
          // Restaurar dados de usuário convidado
          const parsedGuestUser = JSON.parse(guestData);
          setUser(parsedGuestUser);
          setIsGuest(true);
        }
        // SE NENHUM DADO ENCONTRADO: estado permanece null (primeiro uso)
        console.log('[AuthProvider] ✅ Session check complete');

      } catch (error) {
        console.error('[AuthProvider] ❌ Initialization error:', error);
        // EM CASO DE ERRO: estado limpo mas marca como pronto
        secureStorage.remove('session_token');
        secureStorage.remove('user_data');
        secureStorage.remove('guest_user_data');
        setIsPreferencesReady(true); // Marcar como pronto mesmo com erro
      } finally {
        // ✅ PASSO 4: Marcar como pronto APENAS após TUDO inicializar
        setIsLoading(false);
        console.log('[AuthProvider] 🚀 Initialization complete - App ready!');
      }
    };

    initializeApp();
  }, []);

  // Criar token de sessão
  const createSessionToken = (userId: string): string => {
    const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
    const payload = btoa(JSON.stringify({
      sub: userId,
      iat: Date.now() / 1000,
      exp: (Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 dias
    }));
    return `${header}.${payload}.signature`;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Simular autenticação local - SEM DADOS MOCKADOS
      const storedUsers = secureStorage.get('users');
      const users = storedUsers ? JSON.parse(storedUsers) : {};

      // Se não há usuários cadastrados, retornar falso
      if (Object.keys(users).length === 0) {
        return false;
      }

      const hashedPassword = await hashPassword(password);
      const userKey = email.toLowerCase();

      if (users[userKey] && users[userKey].passwordHash === hashedPassword) {
        const userData = users[userKey].user;
        const token = createSessionToken(userData.id);

        // Atualizar último login
        userData.lastLogin = new Date().toISOString();
        users[userKey].user = userData;
        secureStorage.set('users', JSON.stringify(users));

        // Salvar sessão
        secureStorage.set('session_token', token);
        secureStorage.set('user_data', JSON.stringify(userData));

        // Salvar meta no storageService
        storageService.saveDailyGoal(userData.dailyGoalMl);

        // Marcar onboarding como concluído se for primeiro acesso
        const appSettings = storageService.loadAppSettings();
        if (appSettings.firstTimeUser) {
          storageService.markOnboardingCompleted();
        }

        // Limpar dados de convidado se existir
        secureStorage.remove('guest_user_data');

        setUser(userData);
        setSessionToken(token);
        setIsGuest(false);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = async (): Promise<void> => {
    try {
      setIsLoading(true);

      const guestUser: User = {
        id: `guest_${Date.now()}`,
        name: 'Convidado',
        weightKg: 70, // Peso padrão
        heightCm: 170, // Altura padrão
        sex: 'Prefiro não responder',
        dailyGoalMl: 2000, // Meta padrão
        themePref: 'light',
        lastLogin: new Date().toISOString(),
        level: 1,
        xp: 0,
        wakeTime: '07:00',
        sleepTime: '23:00'
      };

      setUser(guestUser);
      setIsGuest(true);

      // Salvar localmente para persistência
      secureStorage.set('guest_user_data', JSON.stringify(guestUser));

      // Salvar dados no storageService
      storageService.saveDailyGoal(guestUser.dailyGoalMl);
      storageService.markInitialSetupCompleted();

      // Configurar settings padrão
      const userSettings: UserSettings = {
        notifications: false, // Desativar notificações para convidado por padrão
        reminderInterval: 120,
        quietHours: {
          start: guestUser.wakeTime || '07:00',
          end: guestUser.sleepTime || '23:00'
        },
        weekendReminders: true,
        smartReminders: true,
        soundEnabled: true,
        hapticFeedback: true,
        notificationPermission: 'default',
        lastNotificationCheck: new Date().toISOString()
      };
      storageService.saveUserSettings(userSettings);

      // Limpar dados de sessão de usuário registrado se existir
      secureStorage.remove('session_token');
      secureStorage.remove('user_data');

    } catch (error) {
      console.error('Erro no login como convidado:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createUserFromSetup = (setupData: SetupData) => {
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      name: setupData.name || 'Usuário',
      weightKg: parseInt(setupData.weightKg) || 0,
      heightCm: parseInt(setupData.heightCm) || 0,
      sex: setupData.sex,
      dailyGoalMl: setupData.dailyGoalMl || 2000, // Valor padrão se não fornecido
      themePref: 'light',
      lastLogin: new Date().toISOString(),
      level: 1,
      xp: 0,
      wakeTime: setupData.wakeTime || '07:00',
      sleepTime: setupData.sleepTime || '23:00'
    };

    setUser(guestUser);
    setIsGuest(true);

    // Salvar localmente para persistência
    secureStorage.set('guest_user_data', JSON.stringify(guestUser));

    // Salvar dados no storageService
    storageService.saveDailyGoal(guestUser.dailyGoalMl);
    storageService.markInitialSetupCompleted();

    // Configurar settings padrão
    const userSettings: UserSettings = {
      notifications: true,
      reminderInterval: 120,
      quietHours: {
        start: guestUser.wakeTime || '07:00',
        end: guestUser.sleepTime || '23:00'
      },
      weekendReminders: true,
      smartReminders: true,
      soundEnabled: true,
      hapticFeedback: true,
      notificationPermission: 'default',
      lastNotificationCheck: new Date().toISOString()
    };
    storageService.saveUserSettings(userSettings);
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);

      const userId = `user_${Date.now()}`;
      const hashedPassword = await hashPassword(userData.password);

      // Calcular meta baseada no peso (35ml/kg) se peso fornecido, senão usar 2000ml padrão
      const dailyGoalMl = userData.weightKg > 0 ? Math.round(userData.weightKg * 35) : 2000;

      const newUser: User = {
        id: userId,
        name: userData.name,
        email: userData.email,
        weightKg: userData.weightKg,
        heightCm: userData.heightCm,
        sex: userData.sex,
        dailyGoalMl,
        themePref: 'light',
        lastLogin: new Date().toISOString(),
        level: 1,
        xp: 0,
        wakeTime: '07:00', // Valores padrão
        sleepTime: '23:00'
      };

      // Salvar usuário
      const storedUsers = secureStorage.get('users');
      const users = storedUsers ? JSON.parse(storedUsers) : {};

      const userKey = (userData.email || userData.name).toLowerCase();

      // Verificar se usuário já existe
      if (users[userKey]) {
        throw new Error('Usuário já existe');
      }

      users[userKey] = {
        user: newUser,
        passwordHash: hashedPassword
      };

      secureStorage.set('users', JSON.stringify(users));

      // Criar sessão
      const token = createSessionToken(userId);
      secureStorage.set('session_token', token);
      secureStorage.set('user_data', JSON.stringify(newUser));

      // Salvar dados no storageService
      storageService.saveDailyGoal(dailyGoalMl);
      storageService.markInitialSetupCompleted();
      storageService.markOnboardingCompleted();

      // Configurar settings padrão
      const userSettings: UserSettings = {
        notifications: true,
        reminderInterval: 120,
        quietHours: { start: '07:00', end: '23:00' },
        weekendReminders: true,
        smartReminders: true,
        soundEnabled: true,
        hapticFeedback: true,
        notificationPermission: 'default',
        lastNotificationCheck: new Date().toISOString()
      };
      storageService.saveUserSettings(userSettings);

      // Limpar dados de convidado se existir
      secureStorage.remove('guest_user_data');

      setUser(newUser);
      setSessionToken(token);
      setIsGuest(false);

      return true;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (clearData = false) => {
    if (clearData) {
      // Apagar todos os dados locais - LIMPEZA COMPLETA
      secureStorage.remove('users');
      secureStorage.remove('user_data');
      secureStorage.remove('guest_user_data');
      secureStorage.remove('session_token');

      // Usar storageService para limpar dados
      storageService.clearAllData();
    } else {
      // Apenas limpar sessão, manter dados
      secureStorage.remove('session_token');
      if (isGuest) {
        secureStorage.remove('guest_user_data');
      }
    }

    // Limpar estado
    setUser(null);
    setSessionToken(null);
    setIsGuest(false);
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);

    // Atualizar dados no storageService
    if (userData.dailyGoalMl) {
      storageService.saveDailyGoal(userData.dailyGoalMl);
    }

    // Atualizar armazenamento
    if (isGuest) {
      secureStorage.set('guest_user_data', JSON.stringify(updatedUser));
    } else {
      secureStorage.set('user_data', JSON.stringify(updatedUser));

      const storedUsers = secureStorage.get('users');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const userKey = (user.email || user.name).toLowerCase();
        if (users[userKey]) {
          users[userKey].user = updatedUser;
          secureStorage.set('users', JSON.stringify(users));
        }
      }
    }
  };

  const exportData = (): string => {
    // Usar storageService para criar backup
    return storageService.createBackup();
  };

  const importData = (jsonData: string): boolean => {
    // Usar storageService para restaurar backup
    const success = storageService.restoreBackup(jsonData);

    if (success) {
      // Recarregar dados do usuário se necessário
      const userData = secureStorage.get('user_data');
      const guestData = secureStorage.get('guest_user_data');

      if (userData) {
        setUser(JSON.parse(userData));
        setIsGuest(false);
      } else if (guestData) {
        setUser(JSON.parse(guestData));
        setIsGuest(true);
      }
    }

    return success;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isPreferencesReady,
    isGuest,
    login,
    loginAsGuest,
    register,
    createUserFromSetup,
    logout,
    updateUser,
    exportData,
    importData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;