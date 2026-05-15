// ❌ NÃO USAR TOASTS/SNACKBARS/POP-UPS FLUTUANTES NESTE APP
// Use feedback visual direto nos botões (ripple, glow, pulse, scale)
// Este componente foi criado para substituir completamente os toasts

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export type FeedbackType = 'success' | 'error' | 'info';

interface ButtonFeedbackProps {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
    onAction?: () => Promise<void>;
    feedbackType?: FeedbackType;
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    showIcon?: boolean;
    feedbackDuration?: number; // ms
}

export function ButtonWithFeedback({
    children,
    onClick,
    onAction,
    feedbackType = 'success',
    className = '',
    disabled = false,
    type = 'button',
    showIcon = true,
    feedbackDuration = 1200
}: ButtonFeedbackProps) {
    const [feedback, setFeedback] = useState<FeedbackType | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled || isLoading) return;

        setIsLoading(true);
        setFeedback(null);

        try {
            // Call onClick if provided
            if (onClick) {
                await onClick(e);
            }

            // Call onAction if provided
            if (onAction) {
                await onAction();
            }

            // Show success feedback
            setFeedback(feedbackType);
            setTimeout(() => setFeedback(null), feedbackDuration);
        } catch (error) {
            // Show error feedback
            setFeedback('error');
            setTimeout(() => setFeedback(null), feedbackDuration);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const getFeedbackStyles = () => {
        if (!feedback) return '';

        switch (feedback) {
            case 'success':
                return 'ring-4 ring-green-400/50 dark:ring-green-600/50 shadow-lg shadow-green-500/50';
            case 'error':
                return 'ring-4 ring-red-400/50 dark:ring-red-600/50 shadow-lg shadow-red-500/50 animate-shake';
            case 'info':
                return 'ring-4 ring-blue-400/50 dark:ring-blue-600/50 shadow-lg shadow-blue-500/50';
            default:
                return '';
        }
    };

    const FeedbackIcon = () => {
        if (!feedback || !showIcon) return null;

        const Icon = feedback === 'success' ? CheckCircle : feedback === 'error' ? AlertCircle : Info;
        const color = feedback === 'success' ? 'text-green-500' : feedback === 'error' ? 'text-red-500' : 'text-blue-500';

        return (
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className={`absolute -top-1 -right-1 ${color} bg-background rounded-full p-0.5`}
            >
                <Icon size={16} />
            </motion.div>
        );
    };

    return (
        <motion.button
            type={type}
            onClick={handleClick}
            disabled={disabled || isLoading}
            className={`relative ${className} ${getFeedbackStyles()} transition-all duration-200`}
            whileTap={!disabled && !isLoading ? { scale: 0.95 } : {}}
            animate={feedback ? {
                scale: [1, 1.05, 1],
            } : {}}
            transition={{ duration: 0.3 }}
        >
            {children}
            <FeedbackIcon />

            {/* Loading spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-inherit">
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </motion.button>
    );
}

// Shake animation for errors
const shakeKeyframes = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
`;

// Add shake animation to global styles if not already present
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = shakeKeyframes;
    document.head.appendChild(styleSheet);
}
