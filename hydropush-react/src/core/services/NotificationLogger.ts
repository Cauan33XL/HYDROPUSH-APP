/**
 * Sistema de logging estruturado para notificações
 */

import { NotificationLog, LogLevel } from '../types/notificationTypes';

class NotificationLogger {
    private logs: NotificationLog[] = [];
    private maxLogs: number = 100;
    private persistToStorage: boolean = true;
    private storageKey: string = 'notification_logs';

    constructor() {
        this.loadLogsFromStorage();
    }

    /**
     * Registra um log de DEBUG
     */
    debug(message: string, data?: any, service: string = 'NotificationService'): void {
        this.log('DEBUG', message, data, service);
    }

    /**
     * Registra um log de INFO
     */
    info(message: string, data?: any, service: string = 'NotificationService'): void {
        this.log('INFO', message, data, service);
    }

    /**
     * Registra um log de WARN
     */
    warn(message: string, data?: any, service: string = 'NotificationService'): void {
        this.log('WARN', message, data, service);
    }

    /**
     * Registra um log de ERROR
     */
    error(message: string, data?: any, service: string = 'NotificationService'): void {
        this.log('ERROR', message, data, service);
    }

    /**
     * Método genérico de log
     */
    private log(level: LogLevel, message: string, data?: any, service: string = 'NotificationService'): void {
        const logEntry: NotificationLog = {
            timestamp: new Date(),
            level,
            message,
            data,
            service
        };

        this.logs.push(logEntry);

        // Limitar o tamanho do array
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Persistir se habilitado
        if (this.persistToStorage) {
            this.saveLogsToStorage();
        }

        // Log no console também
        this.logToConsole(logEntry);
    }

    /**
     * Exibe log no console do navegador
     */
    private logToConsole(log: NotificationLog): void {
        const timestamp = log.timestamp.toISOString();
        const prefix = `[${timestamp}] [${log.service}] [${log.level}]`;

        const style = this.getConsoleStyle(log.level);

        if (log.data) {
            console.log(`%c${prefix}%c ${log.message}`, style, '', log.data);
        } else {
            console.log(`%c${prefix}%c ${log.message}`, style, '');
        }
    }

    /**
     * Retorna o estilo CSS para o console
     */
    private getConsoleStyle(level: LogLevel): string {
        switch (level) {
            case 'DEBUG':
                return 'color: #666; font-weight: normal;';
            case 'INFO':
                return 'color: #1E88E5; font-weight: bold;';
            case 'WARN':
                return 'color: #FF9800; font-weight: bold;';
            case 'ERROR':
                return 'color: #F44336; font-weight: bold;';
            default:
                return '';
        }
    }

    /**
     * Salva logs no localStorage
     */
    private saveLogsToStorage(): void {
        try {
            const serializedLogs = JSON.stringify(this.logs.slice(-50)); // Salvar apenas os últimos 50
            localStorage.setItem(this.storageKey, serializedLogs);
        } catch (error) {
            console.warn('Não foi possível salvar logs no localStorage', error);
        }
    }

    /**
     * Carrega logs do localStorage
     */
    private loadLogsFromStorage(): void {
        try {
            const serialized = localStorage.getItem(this.storageKey);
            if (serialized) {
                const parsed = JSON.parse(serialized);
                this.logs = parsed.map((log: any) => ({
                    ...log,
                    timestamp: new Date(log.timestamp)
                }));
            }
        } catch (error) {
            console.warn('Não foi possível carregar logs do localStorage', error);
            this.logs = [];
        }
    }

    /**
     * Retorna todos os logs
     */
    getAllLogs(): NotificationLog[] {
        return [...this.logs];
    }

    /**
     * Retorna logs filtrados por nível
     */
    getLogsByLevel(level: LogLevel): NotificationLog[] {
        return this.logs.filter(log => log.level === level);
    }

    /**
     * Retorna logs filtrados por serviço
     */
    getLogsByService(service: string): NotificationLog[] {
        return this.logs.filter(log => log.service === service);
    }

    /**
     * Retorna logs recentes (últimas N entradas)
     */
    getRecentLogs(count: number = 10): NotificationLog[] {
        return this.logs.slice(-count);
    }

    /**
     * Limpa todos os logs
     */
    clearLogs(): void {
        this.logs = [];
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.warn('Não foi possível limpar logs do localStorage', error);
        }
    }

    /**
     * Exporta logs como JSON
     */
    exportLogsAsJSON(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * Exporta logs como texto
     */
    exportLogsAsText(): string {
        return this.logs
            .map(log => {
                const timestamp = log.timestamp.toISOString();
                const dataStr = log.data ? ` | Data: ${JSON.stringify(log.data)}` : '';
                return `[${timestamp}] [${log.service}] [${log.level}] ${log.message}${dataStr}`;
            })
            .join('\n');
    }

    /**
     * Define se deve persistir logs no storage
     */
    setPersistence(enabled: boolean): void {
        this.persistToStorage = enabled;
    }

    /**
     * Define o número máximo de logs a manter
     */
    setMaxLogs(max: number): void {
        this.maxLogs = max;
        if (this.logs.length > max) {
            this.logs = this.logs.slice(-max);
        }
    }
}

export const notificationLogger = new NotificationLogger();
