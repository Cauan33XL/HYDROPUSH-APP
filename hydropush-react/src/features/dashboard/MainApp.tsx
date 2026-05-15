import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Droplets, BarChart3, User, BookOpen, Settings, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { HydrationDashboard } from './HydrationDashboard';
import { StatsView } from '../stats/StatsView';
import { ProfileViewNew as ProfileView } from '../profile/ProfileViewNew';
import { HistoryView } from '../history/HistoryView';
import { SettingsView } from '../profile/SettingsView';
import { OfflineIndicator } from '../../shared/components/OfflineIndicator';
import { storageService } from '../../core/services/StorageService';
import { notificationService } from '../../core/services/NotificationService';
import { useNotificationScheduler } from '../../shared/hooks/useNotificationScheduler';
import type { HydrationDay, HydrationEntry, UserStats } from '../../core/services/StorageService';

type TabType = 'home' | 'stats' | 'history' | 'profile' | 'settings';

interface HydrationData {
    currentAmount: number;
    dailyGoal: number;
    userName: string;
}

// Componente principal da aplicação autenticada
export function MainApp() {
    const { user, updateUser } = useAuth();
    const { scheduleHydrationReminders, cancelAllReminders } = useNotificationScheduler();

    // ✅ Restaurar última tab ativa quando app inicializa
    const getInitialTab = (): TabType => {
        const lastView = storageService.loadLastActiveView();
        if (lastView && ['home', 'stats', 'history', 'profile', 'settings'].includes(lastView)) {
            return lastView as TabType;
        }
        return 'home';
    };

    const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hydrationData, setHydrationData] = useState<HydrationData>({
        currentAmount: 0,
        dailyGoal: user?.dailyGoalMl || 2000,
        userName: user?.name || 'Usuário'
    });
    const [history, setHistory] = useState<HydrationDay[]>([]);

    const loadInitialData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const today = new Date().toLocaleDateString('en-CA');
            const dailyGoal = storageService.loadDailyGoal();
            const todayEntries = storageService.loadHydrationEntries(today);
            const currentAmount = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
            const loadedHistory = storageService.loadHydrationHistory();

            setHydrationData({
                currentAmount,
                dailyGoal,
                userName: user?.name || 'Usuário'
            });
            setHistory(loadedHistory);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            setError('Erro ao carregar dados. Tente recarregar a página.');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadInitialData();

        // Inicializar serviço de notificações
        if (notificationService.isSupported()) {
            console.log('Serviço de notificações inicializado');
        }

        // ✅ Listener para sincronizar meta diária quando mudar no perfil
        const unsubscribeGoal = storageService.subscribe('user_daily_goal', (newGoal) => {
            if (newGoal && typeof newGoal === 'number') {
                setHydrationData(prev => ({
                    ...prev,
                    dailyGoal: newGoal
                }));
                console.log('📊 Meta diária atualizada:', (newGoal / 1000).toFixed(1) + 'L');
            }
        });

        // ✅ Listener para quando app volta do background
        const handleAppResume = () => {
            console.log('[MainApp] App resumed, refreshing data...');
            // Apenas atualizar dados, NÃO resetar navegação
            loadInitialData();
        };

        window.addEventListener('app:resumed', handleAppResume);

        return () => {
            unsubscribeGoal();
            window.removeEventListener('app:resumed', handleAppResume);
        };
    }, [loadInitialData]);

    // 🔔 Inicializar notification scheduler
    useEffect(() => {
        const initializeNotifications = async () => {
            try {
                const settings = storageService.loadUserSettings();

                if (settings.notifications) {
                    console.log('🔔 Agendando notificações de hidratação...');
                    await scheduleHydrationReminders({
                        enabled: settings.notifications,
                        interval: settings.reminderInterval,
                        quietHoursStart: settings.quietHours.start,
                        quietHoursEnd: settings.quietHours.end,
                        weekendReminders: settings.weekendReminders,
                        smartReminders: settings.smartReminders
                    });
                    console.log('✅ Notificações agendadas com sucesso');
                }
            } catch (error) {
                console.error('❌ Erro ao inicializar notificações:', error);
            }
        };

        initializeNotifications();
    }, [scheduleHydrationReminders]);

    // 🔔 Event listener para mudanças nas configurações de notificação
    useEffect(() => {
        const handleSettingsChange = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const settings = customEvent.detail;

            try {
                if (settings.notifications) {
                    console.log('🔄 Reagendando notificações...');
                    await scheduleHydrationReminders({
                        enabled: settings.notifications,
                        interval: settings.reminderInterval,
                        quietHoursStart: settings.quietHours.start,
                        quietHoursEnd: settings.quietHours.end,
                        weekendReminders: settings.weekendReminders,
                        smartReminders: settings.smartReminders
                    });
                    console.log('✅ Notificações reagendadas');
                } else {
                    console.log('🔕 Cancelando notificações...');
                    await cancelAllReminders();
                    console.log('✅ Notificações canceladas');
                }
            } catch (error) {
                console.error('❌ Erro ao atualizar notificações:', error);
            }
        };

        window.addEventListener('notificationSettingsChanged', handleSettingsChange);
        return () => window.removeEventListener('notificationSettingsChanged', handleSettingsChange);
    }, [scheduleHydrationReminders, cancelAllReminders]);

    const userStats = useMemo((): UserStats => {
        return storageService.calculateUserStats(history);
    }, [history]);

    const addDrink = useCallback(async (drinkAmount: number) => {
        try {
            setError(null);
            const previousAmount = hydrationData.currentAmount;
            const newAmount = Math.min(hydrationData.currentAmount + drinkAmount, hydrationData.dailyGoal * 1.5);

            setHydrationData(prev => ({
                ...prev,
                currentAmount: newAmount
            }));

            const today = new Date().toLocaleDateString('en-CA');
            const timestamp = new Date().toISOString();
            const entry: HydrationEntry = {
                timestamp,
                amount: drinkAmount,
                type: 'manual'
            };

            storageService.addHydrationEntry(today, entry);
            storageService.updateHistoryDay(today, newAmount, hydrationData.dailyGoal);

            const updatedHistory = storageService.loadHydrationHistory();
            setHistory(updatedHistory);

            // Feedback tátil igual ao protótipo
            // if (navigator.vibrate) {
            //    navigator.vibrate(50);
            // }

            const hasReachedGoal = previousAmount < hydrationData.dailyGoal && newAmount >= hydrationData.dailyGoal;
            if (hasReachedGoal) {
                toast.success('🎉 Parabéns! Meta diária alcançada!', {
                    description: 'Você está mantendo uma ótima hidratação!',
                    duration: 5000,
                });
                // if (navigator.vibrate) {
                //    navigator.vibrate([100, 50, 100]); 
                // }
            }
        } catch (err) {
            console.error('Erro ao adicionar bebida:', err);
            setError('Erro ao salvar o consumo. Tente novamente.');
            setHydrationData(prev => ({
                ...prev,
                currentAmount: prev.currentAmount - drinkAmount
            }));
        }
    }, [hydrationData.currentAmount, hydrationData.dailyGoal]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updateGoal = useCallback(async (newGoal: number) => {
        try {
            setHydrationData(prev => ({
                ...prev,
                dailyGoal: newGoal
            }));

            // Atualizar no perfil do usuário
            if (user) {
                updateUser({ dailyGoalMl: newGoal });
            }

            // Atualizar no storage
            storageService.saveDailyGoal(newGoal);

            // Atualizar histórico com nova meta
            const today = new Date().toLocaleDateString('en-CA');
            storageService.updateHistoryDay(today, hydrationData.currentAmount, newGoal);

            const updatedHistory = storageService.loadHydrationHistory();
            setHistory(updatedHistory);
        } catch (err) {
            console.error('Erro ao atualizar meta:', err);
            setError('Erro ao atualizar meta. Tente novamente.');
        }
    }, [user, updateUser, hydrationData.currentAmount]);

    const resetToday = useCallback(async () => {
        try {
            setError(null);
            const today = new Date().toLocaleDateString('en-CA');
            storageService.saveHydrationEntries(today, []);
            storageService.updateHistoryDay(today, 0, hydrationData.dailyGoal);

            setHydrationData(prev => ({
                ...prev,
                currentAmount: 0
            }));

            const updatedHistory = storageService.loadHydrationHistory();
            setHistory(updatedHistory);
        } catch (err) {
            console.error('Erro ao resetar dados:', err);
            setError('Erro ao resetar dados do dia. Tente novamente.');
        }
    }, [hydrationData.dailyGoal]);

    const exportData = useCallback(() => {
        try {
            const backup = storageService.createBackup();
            const blob = new Blob([backup], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hydropush-backup-${new Date().toLocaleDateString('en-CA')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        } catch (err) {
            console.error('Erro ao exportar dados:', err);
            setError('Erro ao exportar dados. Tente novamente.');
            return false;
        }
    }, []);

    const importData = useCallback(async (file: File) => {
        try {
            setError(null);
            const text = await file.text();
            const success = storageService.restoreBackup(text);
            if (success) {
                await loadInitialData();
                return true;
            } else {
                throw new Error('Formato de arquivo inválido');
            }
        } catch (err) {
            console.error('Erro ao importar dados:', err);
            setError('Erro ao importar dados. Verifique o formato do arquivo.');
            return false;
        }
    }, [loadInitialData]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Carregando dados...</p>
                    </motion.div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-destructive/10 border border-destructive rounded-lg p-4"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={20} className="text-destructive" />
                            <h3 className="font-semibold text-destructive">Erro</h3>
                        </div>
                        <p className="text-sm text-destructive mb-4">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="text-sm bg-destructive text-destructive-foreground px-3 py-1 rounded-md hover:bg-destructive/90 transition-colors"
                        >
                            Fechar
                        </button>
                    </motion.div>
                </div>
            );
        }

        switch (activeTab) {
            case 'home':
                return (
                    <HydrationDashboard
                        data={hydrationData}
                        onAddDrink={addDrink}
                        onReset={resetToday}
                        isLoading={isLoading}
                    />
                );
            case 'stats':
                return (
                    <StatsView
                        data={hydrationData}
                        history={history}
                        userStats={userStats}
                    />
                );
            case 'history':
                return (
                    <HistoryView />
                );
            case 'profile':
                return (
                    <ProfileView />
                );
            case 'settings':
                return (
                    <SettingsView
                        onExportData={exportData}
                        onImportData={importData}
                    />
                );
            default:
                return (
                    <HydrationDashboard
                        data={hydrationData}
                        onAddDrink={addDrink}
                        onReset={resetToday}
                        isLoading={isLoading}
                    />
                );
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    return (
        <div className="min-h-screen bg-background w-full max-w-sm mx-auto relative">
            <OfflineIndicator />

            {/* Header com saudação personalizada - Estilo do protótipo */}
            {user && (
                <div className="bg-card border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{getGreeting()},</p>
                            <p className="font-semibold text-foreground">{user.name}! 👋</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Meta diária</p>
                            <p className="text-sm font-semibold text-primary">
                                {(hydrationData.dailyGoal / 1000).toFixed(1)}L
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content - Scrollable - Estilo do protótipo */}
            <div className="pb-28 overflow-y-auto" style={{ height: 'calc(100vh - 160px)' }}>
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{
                        duration: 0.3,
                        ease: [0.22, 1, 0.36, 1]
                    }}
                >
                    {renderContent()}
                </motion.div>
            </div>

            {/* Bottom Navigation - Fixed - Estilo IDÊNTICO ao protótipo */}
            <div className="fixed bottom-0 inset-x-0 bg-card border-t border-border z-50 max-w-sm mx-auto shadow-lg pb-[env(safe-area-inset-bottom)]">
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="flex justify-around py-3 px-2">
                        {[
                            { id: 'home', icon: Droplets, label: 'Início' },
                            { id: 'stats', icon: BarChart3, label: 'Estatísticas' },
                            { id: 'profile', icon: User, label: 'Perfil' },
                            { id: 'history', icon: BookOpen, label: 'Histórico' },
                            { id: 'settings', icon: Settings, label: 'Configurações' },
                        ].map(({ id, icon: Icon, label }, index) => (
                            <motion.button
                                key={id}
                                onClick={() => {
                                    const newTab = id as TabType;
                                    setActiveTab(newTab);
                                    // ✅ Salvar tab ativa para restaurar depois
                                    storageService.saveLastActiveView(newTab);
                                }}
                                className={`flex flex-col items-center gap-1 p-2 relative rounded-xl transition-all duration-300 min-h-[60px] justify-center ${activeTab === id ? 'text-primary' : 'text-muted-foreground'
                                    }`}
                                whileTap={{ scale: 0.85 }}
                                whileHover={{ scale: 1.02 }}
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1, duration: 0.4 }}
                            >
                                {activeTab === id && (
                                    <motion.div
                                        className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 rounded-xl shadow-sm"
                                        layoutId="activeTab"
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 30,
                                            duration: 0.3
                                        }}
                                    />
                                )}
                                <motion.div
                                    className="relative z-20"
                                    animate={{
                                        scale: activeTab === id ? 1.1 : 1,
                                        y: activeTab === id ? -2 : 0
                                    }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 2} />
                                </motion.div>
                                <motion.span
                                    className={`text-[10px] relative z-20 leading-tight text-center ${activeTab === id ? 'font-semibold' : 'font-medium'
                                        }`}
                                    animate={{
                                        scale: activeTab === id ? 1.05 : 1,
                                        opacity: activeTab === id ? 1 : 0.8
                                    }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {label}
                                </motion.span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
