import React from 'react';
import { motion } from 'motion/react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
    className = '',
    variant = 'text',
    width,
    height,
    animation = 'pulse'
}: SkeletonProps) {
    const baseClasses = 'bg-muted/50 animate-pulse';

    const variantClasses = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg'
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer bg-gradient-to-r from-muted/30 via-muted/60 to-muted/30 bg-[length:200%_100%]',
        none: ''
    };

    const style = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'circular' ? '40px' : undefined)
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
        />
    );
}

interface CardSkeletonProps {
    className?: string;
}

export function CardSkeleton({ className = '' }: CardSkeletonProps) {
    return (
        <div className={`bg-card border border-border rounded-2xl p-4 ${className}`}>
            <div className="flex items-center gap-3 mb-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1">
                    <Skeleton width="60%" className="mb-2" />
                    <Skeleton width="40%" />
                </div>
            </div>
            <Skeleton width="100%" height={100} variant="rectangular" />
        </div>
    );
}

interface DashboardSkeletonProps {
    className?: string;
}

export function DashboardSkeleton({ className = '' }: DashboardSkeletonProps) {
    return (
        <div className={`p-6 space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <Skeleton width="40%" className="mb-2" />
                    <Skeleton width="60%" />
                </div>
                <Skeleton variant="circular" width={48} height={48} />
            </div>

            {/* Main Card */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <Skeleton width="50%" className="mb-4" />
                <Skeleton variant="circular" width={200} height={200} className="mx-auto mb-4" />
                <div className="flex justify-center gap-4">
                    <Skeleton width={80} height={40} variant="rectangular" />
                    <Skeleton width={80} height={40} variant="rectangular" />
                    <Skeleton width={80} height={40} variant="rectangular" />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}

interface ListSkeletonProps {
    items?: number;
    className?: string;
}

export function ListSkeleton({ items = 5, className = '' }: ListSkeletonProps) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Skeleton variant="circular" width={40} height={40} />
                        <div className="flex-1">
                            <Skeleton width="70%" className="mb-2" />
                            <Skeleton width="40%" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    return (
        <div className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin ${className}`} />
    );
}

interface LoadingOverlayProps {
    isLoading: boolean;
    children: React.ReactNode;
    loadingComponent?: React.ReactNode;
}

export function LoadingOverlay({ isLoading, children, loadingComponent }: LoadingOverlayProps) {
    if (!isLoading) return <>{children}</>;

    return (
        <div className="relative">
            <div className="opacity-50 pointer-events-none">
                {children}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                {loadingComponent || <LoadingSpinner size="lg" />}
            </div>
        </div>
    );
}
