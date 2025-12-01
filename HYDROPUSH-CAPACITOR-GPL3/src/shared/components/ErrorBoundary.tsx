import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        this.props.onReset?.();
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md w-full"
                    >
                        <div className="bg-card border border-border rounded-2xl p-6 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4"
                            >
                                <AlertCircle size={32} className="text-destructive" />
                            </motion.div>

                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                Algo deu errado
                            </h2>

                            <p className="text-muted-foreground mb-6">
                                Desculpe, encontramos um erro inesperado. Tente recarregar o aplicativo.
                            </p>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="mb-6 text-left bg-muted/50 rounded-lg p-4">
                                    <summary className="cursor-pointer font-medium text-sm text-foreground mb-2">
                                        Detalhes do erro (dev)
                                    </summary>
                                    <pre className="text-xs text-muted-foreground overflow-auto">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={this.handleReset}
                                    className="w-full bg-primary hover:bg-primary/90"
                                >
                                    <RefreshCw size={16} className="mr-2" />
                                    Tentar Novamente
                                </Button>

                                <Button
                                    onClick={this.handleReload}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <Home size={16} className="mr-2" />
                                    Recarregar App
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}
