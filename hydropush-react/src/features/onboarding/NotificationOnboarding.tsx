import React, { useState } from 'react';
import { Bell, Check, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { Button } from '../../shared/components/ui/button';

interface NotificationOnboardingProps {
    onComplete: (granted: boolean) => void;
    onSkip?: () => void;
}

export function NotificationOnboarding({ onComplete, onSkip }: NotificationOnboardingProps) {
    const [status, setStatus] = useState<'initial' | 'requesting' | 'granted' | 'denied'>('initial');
    const [isLoading, setIsLoading] = useState(false);

    const requestPermission = async () => {
        setIsLoading(true);
        setStatus('requesting');

        try {
            if (Capacitor.isNativePlatform()) {
                console.log('🔔 Solicitando permissões nativas de notificação...');

                // Verificar status atual antes de solicitar
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
                    const result = await PushNotifications.requestPermissions();
                    permStatus = result;
                } else if (permStatus.receive === 'denied') {
                    // Se já foi negado, tentar solicitar novamente (alguns OS permitem) ou guiar para settings
                    // Mas vamos tentar requestPermissions primeiro, pois o usuário pode ter resetado
                    const result = await PushNotifications.requestPermissions();
                    permStatus = result;
                }

                if (permStatus.receive === 'granted') {
                    console.log('✅ Permissão concedida! Registrando push notifications...');
                    await PushNotifications.register();
                    setStatus('granted');
                    setTimeout(() => onComplete(true), 1500);
                } else {
                    console.warn('❌ Permissão negada');
                    setStatus('denied');
                    // Não fechar automaticamente se negado, dar chance de ir para settings (futuro)
                    setTimeout(() => onComplete(false), 2000);
                }
            } else {
                // Fallback para web
                console.log('🌐 Ambiente web - usando API do navegador');
                const permission = await Notification.requestPermission();

                if (permission === 'granted') {
                    setStatus('granted');
                    setTimeout(() => onComplete(true), 1500);
                } else {
                    setStatus('denied');
                    setTimeout(() => onComplete(false), 2000);
                }
            }
        } catch (error) {
            console.error('Erro ao solicitar permissão:', error);
            setStatus('denied');
            setTimeout(() => onComplete(false), 2000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        onSkip?.();
        onComplete(false);
    };

    return (
        <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <div className="bg-card rounded-3xl shadow-2xl border border-border p-8">
                    <AnimatePresence mode="wait">
                        {status === 'initial' && (
                            <motion.div
                                key="initial"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center space-y-6"
                            >
                                {/* Ícone animado */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'easeInOut'
                                    }}
                                    className="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"
                                >
                                    <Bell size={48} className="text-blue-600 dark:text-blue-400" />
                                </motion.div>

                                {/* Título */}
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-foreground">
                                        Nunca esqueça de se hidratar!
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Ative as notificações para receber lembretes personalizados
                                    </p>
                                </div>

                                {/* Benefícios */}
                                <div className="space-y-3 text-left">
                                    {[
                                        { icon: '💧', text: 'Lembretes personalizados ao longo do dia' },
                                        { icon: '🌙', text: 'Respeita seu horário de descanso (22h-7h)' },
                                        { icon: '🎯', text: 'Ajuda você a atingir suas metas diárias' },
                                        { icon: '⚡', text: 'Frequência ajustável conforme sua rotina' }
                                    ].map((benefit, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg"
                                        >
                                            <span className="text-2xl">{benefit.icon}</span>
                                            <span className="text-sm text-foreground flex-1">
                                                {benefit.text}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Platform indicator */}
                                {Capacitor.isNativePlatform() && (
                                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                        <Smartphone size={14} />
                                        <span>Permissão nativa do Android</span>
                                    </div>
                                )}

                                {/* Botões */}
                                <div className="space-y-3 pt-4">
                                    <Button
                                        onClick={requestPermission}
                                        disabled={isLoading}
                                        className="w-full h-12 text-base font-semibold"
                                        size="lg"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Aguardando...
                                            </div>
                                        ) : (
                                            <>
                                                <Bell size={20} className="mr-2" />
                                                Ativar Notificações
                                            </>
                                        )}
                                    </Button>

                                    <button
                                        onClick={handleSkip}
                                        disabled={isLoading}
                                        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                    >
                                        Talvez mais tarde
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {status === 'granted' && (
                            <motion.div
                                key="granted"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-4 py-8"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                    className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
                                >
                                    <Check size={48} className="text-green-600 dark:text-green-400" />
                                </motion.div>

                                <div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">
                                        Tudo pronto!
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Você receberá lembretes para se manter hidratado
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {status === 'denied' && (
                            <motion.div
                                key="denied"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-4 py-8"
                            >
                                <div className="mx-auto w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                                    <X size={48} className="text-orange-600 dark:text-orange-400" />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">
                                        Notificações desativadas
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Você pode ativar depois nas configurações do app
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
