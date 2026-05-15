import React, { useState, useEffect } from 'react';
import { X, Trash2, RefreshCw, Download, Copy, CheckCircle, AlertCircle, Database, Bell, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../shared/components/ui/button';
import { notificationService } from '../../core/services/NotificationService';

import { unifiedNotificationService } from '../../core/services/UnifiedNotificationService';
import { notificationLogger } from '../../core/services/NotificationLogger';
import { storageService } from '../../core/services/StorageService';
import { Capacitor } from '@capacitor/core';

interface DebugPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
    const [activeTab, setActiveTab] = useState<'notifications' | 'storage' | 'logs' | 'system'>('notifications');
    const [logs, setLogs] = useState<any[]>([]);
    const [storageInfo, setStorageInfo] = useState<any>(null);
    const [testResults, setTestResults] = useState<{ push?: string }>({});
    const [loading, setLoading] = useState<string | null>(null);


    useEffect(() => {
        if (isOpen) {
            loadDebugInfo();
        }
    }, [isOpen, activeTab]);

    const loadDebugInfo = () => {
        if (activeTab === 'logs') {
            setLogs(notificationLogger.getAllLogs());
        } else if (activeTab === 'storage') {
            const info = storageService.estimateStorageUsage();
            setStorageInfo(info);
        }
    };

    const testPushNotification = async () => {
        setLoading('push');
        setTestResults({ ...testResults, push: undefined });
        try {
            await notificationService.showNotification({
                title: '🔔 Debug Test - Push',
                body: 'Teste de notificação push do painel de debug',
                icon: '/favicon.ico',
                tag: 'debug-test'
            });
            setTestResults({ ...testResults, push: 'success' });
        } catch (err) {
            setTestResults({ ...testResults, push: 'error: ' + (err as Error).message });
        } finally {
            setLoading(null);
        }
    };



    const clearAllData = async () => {
        if (confirm('⚠️ Isso vai limpar TODOS os dados do app. Continuar?')) {
            await storageService.clearAllData();
            alert('Dados limpos! Recarregue a página.');
        }
    };

    const resetOnboarding = () => {
        if (confirm('Resetar onboarding?')) {
            storageService.saveAppSettings({
                completedOnboarding: false,
                completedInitialSetup: false,
                firstTimeUser: true
            });
            alert('Onboarding resetado! Recarregue a página.');
        }
    };

    const exportLogs = () => {
        const logsJson = notificationLogger.exportLogsAsJSON();
        const blob = new Blob([logsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hydropush-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyLogs = () => {
        const logsText = notificationLogger.exportLogsAsText();
        navigator.clipboard.writeText(logsText);
        alert('Logs copiados para a área de transferência!');
    };

    const clearLogs = () => {
        if (confirm('Limpar todos os logs?')) {
            notificationLogger.clearLogs();
            setLogs([]);
            alert('Logs limpos!');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-background border-2 border-primary/30 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                🔧 Debug Hydropush
                            </h2>
                            <p className="text-xs text-white/80 mt-1">Ferramentas de desenvolvimento</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full p-2 transition"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-border bg-muted/30">
                        {[
                            { id: 'notifications', label: 'Notificações', icon: Bell },
                            { id: 'storage', label: 'Storage', icon: Database },
                            { id: 'logs', label: 'Logs', icon: AlertCircle },
                            { id: 'system', label: 'Sistema', icon: RefreshCw }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === tab.id
                                    ? 'bg-background text-primary border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Bell size={18} />
                                        Testes de Notificação
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            onClick={testPushNotification}
                                            disabled={loading === 'push'}
                                            variant="outline"
                                            className="h-20"
                                        >
                                            {loading === 'push' ? (
                                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <div className="text-center">
                                                    <Bell size={24} className="mx-auto mb-1" />
                                                    <div className="text-sm">Testar Push</div>
                                                </div>
                                            )}
                                        </Button>


                                    </div>

                                    {/* Test Results */}
                                    {testResults.push && (
                                        <div className="mt-3 space-y-2">
                                            {testResults.push && (
                                                <div className={`p-2 rounded text-xs flex items-center gap-2 ${testResults.push === 'success'
                                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                    : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                    }`}>
                                                    {testResults.push === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                                    Push: {testResults.push}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>



                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-3">Histórico Recente</h3>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {unifiedNotificationService.getCombinedHistory(10).map((item, i) => (
                                            <div key={i} className="p-2 bg-muted/50 rounded text-xs">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-medium">
                                                        {item.type === 'push' ? '🔔' : '📧'} {item.title}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {new Date(item.sentAt).toLocaleTimeString('pt-BR')}
                                                    </span>
                                                </div>
                                                <div className="text-muted-foreground">{item.body}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Storage Tab */}
                        {activeTab === 'storage' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Database size={18} />
                                        Informações de Storage
                                    </h3>
                                    {storageInfo && (
                                        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Tamanho estimado:</span>
                                                <span className="font-mono">{Math.round(storageInfo.bytes / 1024)} KB</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Número de itens:</span>
                                                <span className="font-mono">{storageInfo.items}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-3 text-red-600 dark:text-red-400">Ações Destrutivas</h3>
                                    <div className="space-y-2">
                                        <Button
                                            onClick={resetOnboarding}
                                            variant="outline"
                                            className="w-full justify-start text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                        >
                                            <RefreshCw size={16} className="mr-2" />
                                            Resetar Onboarding
                                        </Button>
                                        <Button
                                            onClick={clearAllData}
                                            variant="destructive"
                                            className="w-full justify-start"
                                        >
                                            <Trash2 size={16} className="mr-2" />
                                            Limpar Todos os Dados
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Logs Tab */}
                        {activeTab === 'logs' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <AlertCircle size={18} />
                                        Logs ({logs.length})
                                    </h3>
                                    <div className="flex gap-2">
                                        <Button onClick={copyLogs} variant="outline" size="sm">
                                            <Copy size={14} className="mr-1" />
                                            Copiar
                                        </Button>
                                        <Button onClick={exportLogs} variant="outline" size="sm">
                                            <Download size={14} className="mr-1" />
                                            Exportar
                                        </Button>
                                        <Button onClick={clearLogs} variant="destructive" size="sm">
                                            <Trash2 size={14} className="mr-1" />
                                            Limpar
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs bg-muted/30 rounded-lg p-2">
                                    {logs.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-8">Nenhum log registrado</div>
                                    ) : (
                                        logs.slice().reverse().map((log, i) => (
                                            <div
                                                key={i}
                                                className={`p-2 rounded mb-1 break-words ${log.level === 'ERROR' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                                                    log.level === 'WARN' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                                                        log.level === 'INFO' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                                                            'bg-muted/50 text-muted-foreground'
                                                    }`}
                                            >
                                                <div className="flex justify-between mb-1 flex-wrap gap-2">
                                                    <span className="font-bold">[{log.level}] {log.service}</span>
                                                    <span className="text-xs">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                                                </div>
                                                <div className="break-words whitespace-pre-wrap">{log.message}</div>
                                                {log.data && (
                                                    <pre className="mt-1 text-xs opacity-75 overflow-x-auto break-words whitespace-pre-wrap">
                                                        {JSON.stringify(log.data, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* System Tab */}
                        {activeTab === 'system' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <RefreshCw size={18} />
                                        Informações do Sistema
                                    </h3>
                                    <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm font-mono">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Plataforma:</span>
                                            <span>{Capacitor.getPlatform()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Nativo:</span>
                                            <span>{Capacitor.isNativePlatform() ? 'Sim' : 'Não'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">User Agent:</span>
                                            <span className="text-xs truncate max-w-xs">{navigator.userAgent}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Idioma:</span>
                                            <span>{navigator.language}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Online:</span>
                                            <span>{navigator.onLine ? '✅ Sim' : '❌ Não'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-3">Notificações</h3>
                                    <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Suportado:</span>
                                            <span>{notificationService.isSupported() ? '✅ Sim' : '❌ Não'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Permissão:</span>
                                            <span>
                                                {notificationService.getPermissionStatus() === 'granted' ? '✅ Concedida' :
                                                    notificationService.getPermissionStatus() === 'denied' ? '❌ Negada' :
                                                        '⚠️ Não solicitada'}
                                            </span>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
