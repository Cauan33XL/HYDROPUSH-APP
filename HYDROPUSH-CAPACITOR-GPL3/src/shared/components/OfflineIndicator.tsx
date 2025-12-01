import React from 'react';
import { motion } from 'motion/react';
import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineIndicator() {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg"
        >
            <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
                <WifiOff size={16} />
                <span>Sem conexão • Modo offline</span>
            </div>
        </motion.div>
    );
}

interface NetworkStatusProps {
    className?: string;
}

export function NetworkStatus({ className = '' }: NetworkStatusProps) {
    const isOnline = useOnlineStatus();

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {isOnline ? (
                <>
                    <Wifi size={16} className="text-green-500" />
                    <span className="text-xs text-muted-foreground">Online</span>
                </>
            ) : (
                <>
                    <WifiOff size={16} className="text-amber-500" />
                    <span className="text-xs text-amber-600 dark:text-amber-400">Offline</span>
                </>
            )}
        </div>
    );
}
