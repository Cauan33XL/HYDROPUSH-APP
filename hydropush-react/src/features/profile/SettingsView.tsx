import React, { useState, useEffect } from 'react';
import {
  Moon,
  ChevronRight,

  Droplets,
  Palette,
  Shield,
  HelpCircle,
  Star,
  Info,
  AlertCircle,
  LogOut,
  Trash2,
  Sun,
  Download,
  Upload
} from 'lucide-react';
import { Switch } from '../../shared/components/ui/switch';
import { Button } from '../../shared/components/ui/button';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { storageService } from '../../core/services/StorageService';
import { useTheme } from '../../contexts/ThemeContext';
import { RatingScreen } from './RatingScreen';
import { HelpSupportScreen } from './HelpSupportScreen';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';
// ThemeColorPicker removed: color-theme feature deprecated
import { NotificationSettings } from './NotificationSettings';

// Lazy load do DebugPanel para reduzir bundle inicial
const DebugPanel = React.lazy(() => import('../../shared/components/DebugPanel').then(module => ({ default: module.DebugPanel })));


interface SettingsViewProps {
  className?: string;
  onSettingsChange?: (settings: unknown) => void;
  onExportData?: () => boolean;
  onImportData?: (file: File) => Promise<boolean>;
}

export function SettingsView({ className, onSettingsChange, onExportData, onImportData }: SettingsViewProps) {
  const { user, isGuest, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState({
    notifications: true,
    reminderInterval: 120, // minutos
    quietHours: { start: '22:00', end: '07:00' },
    weekendReminders: true,
    smartReminders: true,
    // email fields removed: handled in NotificationSettings
  });

  useEffect(() => {
    try {
      const us = storageService.loadUserSettings();
      setSettings(prev => ({
        ...prev,
        notifications: us.notifications,
        reminderInterval: us.reminderInterval,
        quietHours: us.quietHours,
        weekendReminders: us.weekendReminders,
        smartReminders: us.smartReminders,
        // email settings are handled inside NotificationSettings
      }));
    } catch (e) {
      // ignore
    }
  }, []);


  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'main' | 'rating' | 'help' | 'privacy'>('main');
  const [isImporting, setIsImporting] = useState(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [debugPassword, setDebugPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = React.useRef<number | null>(null);

  const toggleSetting = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  // Helper para persistir configurações de usuário relacionadas a lembretes
  const persistUserSetting = (partial: Record<string, unknown>) => {
    try {
      storageService.saveUserSettings(partial as any);
      onSettingsChange?.(partial);
    } catch (e) {
      console.warn('Erro ao persistir configuração de usuário', e);
    }
  };



  const handleLogout = (clearData = false) => {
    logout(clearData);
    setShowLogoutConfirm(false);
    setShowDeleteConfirm(false);
  };

  const handleExportData = () => {
    if (onExportData) {
      onExportData();
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImportData) {
      setIsImporting(true);
      try {
        await onImportData(file);
      } finally {
        setIsImporting(false);
        // Reset the input
        event.target.value = '';
      }
    }
  };

  // Renderizar telas específicas
  if (currentScreen === 'rating') {
    return <RatingScreen onBack={() => setCurrentScreen('main')} />;
  }

  if (currentScreen === 'help') {
    return <HelpSupportScreen onBack={() => setCurrentScreen('main')} />;
  }

  if (currentScreen === 'privacy') {
    return <PrivacyPolicyScreen onBack={() => setCurrentScreen('main')} />;
  }

  // removed: color theme screen

  return (
    <div className={`px-6 py-6 pb-8 space-y-6 ${className || ''}`}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Personalize sua experiência</p>
      </div>

      {/* Seção de Notificações */}
      <NotificationSettings onSettingsChange={(newSettings) => {
        console.log('Configurações de notificação atualizadas:', newSettings);
        onSettingsChange?.(newSettings);
      }} />



      {/* Aparência */}
      <motion.div
        className="bg-card rounded-2xl shadow-sm border border-border mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
              <Palette size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-foreground">Aparência</h3>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon size={16} className="text-muted-foreground" />
              ) : (
                <Sun size={16} className="text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-foreground">Tema {theme === 'dark' ? 'Escuro' : 'Claro'}</p>
                <p className="text-sm text-muted-foreground">
                  {theme === 'dark' ? 'Usar tema escuro' : 'Usar tema claro'}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked: boolean) => {
                const newTheme = checked ? 'dark' : 'light';
                setTheme(newTheme);
              }}
            />
          </div>

          {/* Color theme feature removed — only Light/Dark theme is available now */}
        </div>
      </motion.div>

      {/* Outras Configurações */}
      <motion.div
        className="bg-card rounded-2xl shadow-sm border border-border mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <div className="p-4 space-y-4">
          <motion.button
            onClick={() => setCurrentScreen('privacy')}
            className="w-full flex items-center justify-between p-0 text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Política de Privacidade</p>
                <p className="text-sm text-muted-foreground">Ver nossa política de privacidade</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </motion.button>

          <motion.button
            onClick={() => setCurrentScreen('help')}
            className="w-full flex items-center justify-between p-0 text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <HelpCircle size={16} className="text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Ajuda e Suporte</p>
                <p className="text-sm text-muted-foreground">Obter ajuda usando o Hydropush</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </motion.button>

          <motion.button
            onClick={() => setCurrentScreen('rating')}
            className="w-full flex items-center justify-between p-0 text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <Star size={16} className="text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Avaliar o Hydropush</p>
                <p className="text-sm text-muted-foreground">Compartilhe sua experiência</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </motion.button>
        </div>
      </motion.div>

      {/* Gerenciamento de Dados removed - feature disabled */}

      {/* Conta e Logout */}
      {user && !isGuest && (
        <motion.div
          className="bg-card rounded-2xl shadow-sm border border-border mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <LogOut size={16} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-foreground">Conta</h3>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-[#1E88E5] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Logado como: {user?.name}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {user?.email || 'Sem email cadastrado'}
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut size={16} className="mr-2" />
              Sair da Conta
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full justify-start border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
            >
              <Trash2 size={16} className="mr-2" />
              Apagar Conta e Dados
            </Button>
          </div>
        </motion.div>
      )}

      {/* Modais de Confirmação */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <LogOut size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Sair da conta?</h3>
              <p className="text-sm text-muted-foreground">
                Deseja realmente sair? Você continuará com os dados locais salvos.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 dark:hover:border-red-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleLogout(false)}
                className="flex-1 bg-[#1E88E5] hover:bg-[#1565C0]"
              >
                Sair
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Apagar conta e dados?</h3>
              <p className="text-sm text-muted-foreground">
                Esta ação é irreversível. Todos os seus dados locais serão permanentemente removidos.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 dark:hover:border-red-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleLogout(true)}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Apagar Tudo
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Informações do App */}
      <motion.div
        className="bg-gradient-to-br from-[#1E88E5] to-[#42A5F5] rounded-2xl shadow-sm p-6 text-center text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
          <Droplets size={24} className="text-white" />
        </div>
        <h3 className="font-semibold text-white mb-1">Hydropush</h3>
        <p className="text-sm text-white/80 mb-4">Versão 2.2.0</p>
        <p className="text-sm text-white/80">
          Mantenha-se hidratado, mantenha-se saudável! 💧
        </p>
        <div className="mt-4 pt-4 border-t border-white/20">
          <p
            className="text-xs text-white/60 cursor-pointer select-none hover:text-white/80 transition"
            onClick={() => {
              setClickCount(prev => prev + 1);

              if (clickCount === 1) {
                // Segundo clique - abrir modal de senha
                setShowPasswordModal(true);
                setClickCount(0);
                setDebugPassword('');
                setPasswordError(false);
                if (clickTimerRef.current) {
                  clearTimeout(clickTimerRef.current);
                  clickTimerRef.current = null;
                }
              } else {
                // Primeiro clique - aguardar segundo clique
                if (clickTimerRef.current) {
                  clearTimeout(clickTimerRef.current);
                }
                clickTimerRef.current = window.setTimeout(() => {
                  setClickCount(0);
                  clickTimerRef.current = null;
                }, 500); // 500ms para duplo clique
              }
            }}
          >
            Desenvolvido com ❤️ para sua saúde
          </p>
        </div>
      </motion.div>

      {/* Modal de Senha para Debug */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield size={20} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">🔒 Acesso Restrito</h3>
              <p className="text-sm text-muted-foreground">
                Digite a senha de desenvolvedor para acessar o painel de debug:
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={debugPassword}
                  onChange={(e) => {
                    setDebugPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (debugPassword === 'HYDRODEBUG03') {
                        setShowPasswordModal(false);
                        setDebugPanelOpen(true);
                        setDebugPassword('');
                      } else {
                        setPasswordError(true);
                      }
                    }
                  }}
                  placeholder="Digite a senha..."
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-center font-mono tracking-wider ${passwordError ? 'border-destructive' : 'border-border'
                    }`}
                  autoFocus
                />
                {passwordError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive mt-2 text-center flex items-center justify-center gap-1"
                  >
                    <AlertCircle size={12} />
                    Senha incorreta. Tente novamente.
                  </motion.p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setDebugPassword('');
                    setPasswordError(false);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (debugPassword === 'HYDRODEBUG03') {
                      setShowPasswordModal(false);
                      setDebugPanelOpen(true);
                      setDebugPassword('');
                    } else {
                      setPasswordError(true);
                    }
                  }}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Entrar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Debug Panel Secreto - Lazy loaded */}
      <React.Suspense fallback={null}>
        <DebugPanel isOpen={debugPanelOpen} onClose={() => setDebugPanelOpen(false)} />
      </React.Suspense>

      <div className="h-8"></div> {/* Espaçamento extra para a navegação */}
    </div>
  );
}