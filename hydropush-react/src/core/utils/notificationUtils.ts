/**
 * Funções utilitárias para o sistema de notificações
 */

import { RetryConfig } from '../types/notificationTypes';

/**
 * Valida a sintaxe de um endereço de email
 */
export function validateEmailSyntax(email: string): boolean {
    if (!email || typeof email !== 'string') {
        return false;
    }

    // Regex mais rigorosa para validação de email
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return emailRegex.test(email.trim());
}

/**
 * Valida um email de forma mais rigorosa (sintaxe + domínio básico)
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
    const trimmedEmail = email?.trim();

    if (!trimmedEmail) {
        return { valid: false, error: 'Email é obrigatório' };
    }

    if (trimmedEmail.length > 254) {
        return { valid: false, error: 'Email muito longo (máximo 254 caracteres)' };
    }

    if (!validateEmailSyntax(trimmedEmail)) {
        return { valid: false, error: 'Formato de email inválido' };
    }

    // Verificar se o domínio tem pelo menos um ponto
    const [, domain] = trimmedEmail.split('@');
    if (!domain || !domain.includes('.')) {
        return { valid: false, error: 'Domínio de email inválido' };
    }

    // Verificar se não tem espaços
    if (trimmedEmail.includes(' ')) {
        return { valid: false, error: 'Email não pode conter espaços' };
    }

    // Verificar caracteres consecutivos inválidos
    if (trimmedEmail.includes('..') || trimmedEmail.includes('@.') || trimmedEmail.includes('.@')) {
        return { valid: false, error: 'Email contém pontos consecutivos inválidos' };
    }

    return { valid: true };
}

/**
 * Função genérica de retry com backoff exponencial
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    config: RetryConfig = {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2
    }
): Promise<{ result?: T; success: boolean; error?: Error; retriedCount: number }> {
    let lastError: Error | undefined;
    let currentDelay = config.initialDelayMs;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            const result = await fn();
            return { result, success: true, retriedCount: attempt };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Se for a última tentativa, não aguardar
            if (attempt === config.maxRetries) {
                break;
            }

            // Aguardar com backoff exponencial
            await sleep(Math.min(currentDelay, config.maxDelayMs));
            currentDelay *= config.backoffMultiplier;
        }
    }

    return {
        success: false,
        error: lastError,
        retriedCount: config.maxRetries
    };
}

/**
 * Função auxiliar para aguardar
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Formata horário de notificação para exibição
 */
export function formatNotificationTime(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    // Se já passou
    if (diff < 0) {
        return 'Agora';
    }

    // Menos de 1 minuto
    if (diff < 60000) {
        return 'Em menos de 1 minuto';
    }

    // Menos de 1 hora
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `Em ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    }

    // Menos de 1 dia
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `Em ${hours} hora${hours > 1 ? 's' : ''}`;
    }

    // Mais de 1 dia
    const days = Math.floor(diff / 86400000);
    return `Em ${days} dia${days > 1 ? 's' : ''}`;
}

/**
 * Verifica se está em horário de silêncio
 */
export function isQuietHours(quietStart: string, quietEnd: string): boolean {
    const now = new Date();
    const currentHour = now.getHours();

    const startHour = parseInt(quietStart.split(':')[0]);
    const endHour = parseInt(quietEnd.split(':')[0]);

    // Caso normal: 22:00 - 07:00 (atravessa meia-noite)
    if (startHour > endHour) {
        return currentHour >= startHour || currentHour < endHour;
    }

    // Caso especial: 08:00 - 20:00 (não atravessa meia-noite)
    return currentHour >= startHour && currentHour < endHour;
}

/**
 * Sanitiza conteúdo para uso em email HTML
 */
export function sanitizeEmailContent(content: string): string {
    if (!content) return '';

    return content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Gera um ID único para notificação
 */
export function generateNotificationId(prefix: string = 'notif'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${prefix}_${timestamp}_${random}`;
}

/**
 * Verifica se é um horário apropriado para enviar notificação
 */
export function isAppropriateTime(
    scheduledTime: Date,
    quietHoursStart: string,
    quietHoursEnd: string
): boolean {
    const hour = scheduledTime.getHours();
    const startHour = parseInt(quietHoursStart.split(':')[0]);
    const endHour = parseInt(quietHoursEnd.split(':')[0]);

    if (startHour > endHour) {
        // Atravessa meia-noite (ex: 22:00 - 07:00)
        return !(hour >= startHour || hour < endHour);
    }

    // Não atravessa meia-noite
    return !(hour >= startHour && hour < endHour);
}

/**
 * Ajusta horário para sair do período de silêncio
 */
export function adjustTimeForQuietHours(
    scheduledTime: Date,
    quietHoursStart: string,
    quietHoursEnd: string
): Date {
    if (isAppropriateTime(scheduledTime, quietHoursStart, quietHoursEnd)) {
        return scheduledTime;
    }

    const endHour = parseInt(quietHoursEnd.split(':')[0]);
    const endMinute = parseInt(quietHoursEnd.split(':')[1] || '0');

    const adjusted = new Date(scheduledTime);
    adjusted.setHours(endHour, endMinute, 0, 0);

    // Se o horário ajustado for antes do horário original (caso atravesse meia-noite)
    if (adjusted < scheduledTime) {
        adjusted.setDate(adjusted.getDate() + 1);
    }

    return adjusted;
}

/**
 * Trunca texto para um tamanho específico
 */
export function truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
        return text;
    }

    return text.substring(0, maxLength - 3) + '...';
}
