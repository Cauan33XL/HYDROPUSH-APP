/**
 * Tipos e interfaces para o sistema de notificações
 */

export type NotificationType = 'push';
export type NotificationStatusType = 'pending' | 'sent' | 'failed' | 'retrying';
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

/**
 * Status de uma notificação individual
 */
export interface NotificationStatus {
    id: string;
    type: NotificationType;
    status: NotificationStatusType;
    timestamp: Date;
    error?: string;
    retryCount?: number;
    maxRetries?: number;
}

/**
 * Opções para envio unificado de notificações
 */
export interface UnifiedNotificationOptions {
    title: string;
    body: string;
    sendPush: boolean;
    scheduledTime?: Date;
    data?: Record<string, any>;
    userId?: string;
}

/**
 * Resultado de envio de notificação
 */
export interface NotificationResult {
    success: boolean;
    type: NotificationType;
    id?: string;
    error?: string;
    sentAt?: Date;
    retriedCount?: number;
}

/**
 * Configuração de retry
 */
export interface RetryConfig {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}

/**
 * Log de notificação
 */
export interface NotificationLog {
    timestamp: Date;
    level: LogLevel;
    message: string;
    data?: any;
    service: string;
}

/**
 * Status da fila de notificações
 */
export interface QueueStatus {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
}

/**
 * Histórico de notificação
 */
export interface NotificationHistoryItem {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    sentAt: Date;
    status: NotificationStatusType;
}
