import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, AlertTriangle, Wifi, RefreshCw, ChevronRight, Bell } from 'lucide-react';
import { storageService } from '../../core/services/StorageService';
import { notificationService } from '../../core/services/NotificationService';

export type ServiceStatus = 'healthy' | 'degraded' | 'offline' | 'checking';

interface ServiceStatusIndicatorProps {
    serviceName: string;
    status: ServiceStatus;
    lastChecked?: Date;
    errorMessage?: string;
    onRetest?: () => void;
}

export function ServiceStatusIndicator({
    serviceName,
    status,
    lastChecked,
    errorMessage,
    onRetest
}: ServiceStatusIndicatorProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'healthy':
                return {
                    icon: CheckCircle,
                    color: 'text-green-600 dark:text-green-400',
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    borderColor: 'border-green-200 dark:border-green-800',
                    label: 'Operacional',
                    description: 'Serviço funcionando normalmente'
                };
            case 'degraded':
                return {
                    icon: AlertTriangle,
                    color: 'text-yellow-600 dark:text-yellow-400',
                    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                    borderColor: 'border-yellow-200 dark:border-yellow-800',
                    label: 'Degradado',
                    description: 'Serviço pode apresentar lentidão'
                };
            case 'offline':
                return {
                    icon: XCircle,
                    color: 'text-red-600 dark:text-red-400',
                    bgColor: 'bg-red-50 dark:bg-red-900/20',
                    borderColor: 'border-red-200 dark:border-red-800',
                    label: 'Offline',
                    description: errorMessage || 'Serviço indisponível'
                };
            case 'checking':
                return {
                    icon: RefreshCw,
                    color: 'text-blue-600 dark:text-blue-400',
                    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                    borderColor: 'border-blue-200 dark:border-blue-800',
                    label: 'Verificando...',
                    description: 'Testando conectividade'
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <motion.div
            className={`rounded-xl p-4 border ${config.bgColor} ${config.borderColor}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                    <motion.div
                        animate={status === 'checking' ? { rotate: 360 } : {}}
                        transition={status === 'checking' ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
                    >
                        <Icon className={`${config.color} mt-0.5`} size={20} />
                    </motion.div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground text-sm">{serviceName}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} font-medium`}>
                                {config.label}
                            </span>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">{config.description}</p>

                        {lastChecked && status !== 'checking' && (
                            <p className="text-xs text-muted-foreground mt-1.5">
                                Última verificação: {lastChecked.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                </div>

                {onRetest && status !== 'checking' && (
                    <button
                        onClick={onRetest}
                        className="ml-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-background/50 text-muted-foreground hover:text-foreground"
                    >
                        Testar
                    </button>
                )}
            </div>
        </motion.div>
    );
}

interface NotificationServiceStatusProps {
    className?: string;
}

export function NotificationServiceStatus({ className = '' }: NotificationServiceStatusProps) {
    const [pushStatus, setPushStatus] = useState<ServiceStatus>('checking');
    const [pushLastChecked, setPushLastChecked] = useState<Date>();
    const [pushError, setPushError] = useState<string>();
    const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default'>('default');

    const checkPushNotifications = async () => {
        setPushStatus('checking');
        setPushError(undefined);

        try {
            const permission = await notificationService.checkPermissions();
            setPermissionStatus(permission);

            if (permission === 'denied') {
                setPushStatus('offline');
                setPushError('Permissão negada pelo usuário');
            } else if (permission === 'default') {
                setPushStatus('degraded');
                setPushError('Permissão não concedida');
            } else {
                setPushStatus('healthy');
            }

            setPushLastChecked(new Date());
        } catch (error) {
            console.error('Erro ao verificar push notifications:', error);
            setPushStatus('offline');
            setPushError('Erro ao verificar serviço');
            setPushLastChecked(new Date());
        }
    };



    // Verificar status ao montar
    useEffect(() => {
        checkPushNotifications();
        checkPushNotifications();
    }, []);

    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`space-y-3 ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-0 text-left rounded-lg group"
            >
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Wifi size={16} className="text-blue-600 dark:text-blue-400" />
                    Status dos Serviços de Notificação
                </h3>
                <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </motion.div>
            </button>

            <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden space-y-3"
            >
                {/* Status Geral das Notificações */}
                <div className="rounded-xl p-4 border bg-background/50 border-border">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${permissionStatus === 'granted'
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                            <Bell size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground text-sm">Status das Notificações</h4>
                            <p className={`text-xs font-medium ${permissionStatus === 'granted'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                {permissionStatus === 'granted' ? 'Permitidas' : 'Não Permitidas'}
                            </p>
                        </div>
                    </div>
                </div>

                <ServiceStatusIndicator
                    serviceName="Notificações Push"
                    status={pushStatus}
                    lastChecked={pushLastChecked}
                    errorMessage={pushError}
                    onRetest={checkPushNotifications}
                />


            </motion.div>
        </div>
    );
}
