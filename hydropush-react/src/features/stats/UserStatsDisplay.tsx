import React, { useState, useEffect } from 'react';
import { TrendingUp, Flame, Target, Calendar, Droplets, Award, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { storageService } from '../../core/services/StorageService';

interface UserStatsDisplayProps {
  autoLoad?: boolean;
  stats?: {
    totalDaysTracked: number;
    currentStreak: number;
    bestStreak: number;
    totalWaterConsumed: number;
    perfectDays: number;
    monthlyGoalsAchieved: number;
    totalGoalsAchieved: number;
    averageCompletion: number;
  };
}

export function UserStatsDisplay({ autoLoad = true, stats: externalStats }: UserStatsDisplayProps) {
  const [isLoading, setIsLoading] = useState(autoLoad && !externalStats);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState(externalStats || {
    totalDaysTracked: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalWaterConsumed: 0,
    perfectDays: 0,
    monthlyGoalsAchieved: 0,
    totalGoalsAchieved: 0,
    averageCompletion: 0
  });

  // Carregar estatísticas do usuário se autoLoad estiver ativado
  useEffect(() => {
    if (!autoLoad || externalStats) {
      setIsLoading(false);
      return;
    }

    const loadUserStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const userStats = storageService.loadUserStats();
        
        setStats({
          totalDaysTracked: userStats.totalDaysTracked,
          currentStreak: userStats.currentStreak,
          bestStreak: userStats.bestStreak,
          totalWaterConsumed: userStats.totalWaterConsumed,
          perfectDays: userStats.perfectDays,
          monthlyGoalsAchieved: userStats.monthlyGoalsAchieved,
          totalGoalsAchieved: userStats.totalGoalsAchieved,
          averageCompletion: userStats.averageCompletion
        });

      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
        setError('Erro ao carregar estatísticas do usuário');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserStats();
  }, [autoLoad, externalStats]);

  const formatWaterAmount = (ml: number) => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)}L`;
    }
    return `${ml}ml`;
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⚡';
    if (streak >= 7) return '💪';
    if (streak >= 3) return '🎯';
    return '💧';
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      'from-orange-400 to-red-500',
      'from-yellow-400 to-orange-500',
      'from-blue-400 to-cyan-500',
      'from-purple-400 to-purple-600',
      'from-green-400 to-emerald-500',
      'from-indigo-400 to-indigo-600'
    ];
    return gradients[index % gradients.length];
  };

  const handleRefreshStats = () => {
    if (autoLoad && !externalStats) {
      const userStats = storageService.loadUserStats();
      setStats({
        totalDaysTracked: userStats.totalDaysTracked,
        currentStreak: userStats.currentStreak,
        bestStreak: userStats.bestStreak,
        totalWaterConsumed: userStats.totalWaterConsumed,
        perfectDays: userStats.perfectDays,
        monthlyGoalsAchieved: userStats.monthlyGoalsAchieved,
        totalGoalsAchieved: userStats.totalGoalsAchieved,
        averageCompletion: userStats.averageCompletion
      });
    }
  };

  const statsCards = [
    {
      title: 'Sequência Atual',
      value: stats.currentStreak,
      unit: 'dias',
      icon: Flame,
      emoji: getStreakEmoji(stats.currentStreak),
      description: 'Dias seguidos atingindo a meta',
      progress: Math.min((stats.currentStreak / Math.max(stats.bestStreak, 1)) * 100, 100)
    },
    {
      title: 'Melhor Sequência',
      value: stats.bestStreak,
      unit: 'dias',
      icon: Award,
      emoji: '🏆',
      description: 'Seu recorde pessoal',
      progress: 100
    },
    {
      title: 'Total Consumido',
      value: formatWaterAmount(stats.totalWaterConsumed),
      unit: '',
      icon: Droplets,
      emoji: '🌊',
      description: 'Água total rastreada',
      progress: Math.min((stats.totalWaterConsumed / (stats.totalDaysTracked * 2000)) * 100, 100)
    },
    {
      title: 'Dias Rastreados',
      value: stats.totalDaysTracked,
      unit: 'dias',
      icon: Calendar,
      emoji: '📅',
      description: 'Usando o Hydropush',
      progress: Math.min((stats.totalDaysTracked / 90) * 100, 100)
    },
    {
      title: 'Metas Atingidas',
      value: stats.totalGoalsAchieved,
      unit: `de ${stats.totalDaysTracked}`,
      icon: Target,
      emoji: '🎯',
      description: 'Dias com 100% da meta',
      progress: stats.totalDaysTracked > 0 ? (stats.totalGoalsAchieved / stats.totalDaysTracked) * 100 : 0
    },
    {
      title: 'Média de Conclusão',
      value: stats.averageCompletion,
      unit: '%',
      icon: TrendingUp,
      emoji: '📊',
      description: 'Eficiência média diária',
      progress: stats.averageCompletion
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div
            key={index}
            className="bg-muted/50 p-4 rounded-xl animate-pulse"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="w-6 h-6 bg-muted rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-destructive/10 border border-destructive rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive mb-3">{error}</p>
          <button
            onClick={handleRefreshStats}
            className="text-sm text-primary hover:underline rounded-md"
          >
            Tentar novamente
          </button>
          
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com botão de atualizar */}
      {autoLoad && !externalStats && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Estatísticas Pessoais</h3>
          <button
            onClick={handleRefreshStats}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Atualizar estatísticas"
          >
            <RefreshCw size={16} className="text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            className={`bg-gradient-to-br ${getGradientClass(index)} p-4 rounded-xl text-white shadow-lg relative overflow-hidden`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Efeito de brilho */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -skew-x-12 transform opacity-50"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <stat.icon size={20} className="text-white" />
                </div>
                <span className="text-2xl">{stat.emoji}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold">
                    {stat.value}
                  </p>
                  {stat.unit && <span className="text-sm font-normal opacity-90">{stat.unit}</span>}
                </div>
                <p className="text-sm font-medium">{stat.title}</p>
                <p className="text-xs text-white/80">{stat.description}</p>
              </div>

              {/* Barra de progresso sutil */}
              {stat.progress > 0 && (
                <div className="mt-3 w-full bg-white/20 rounded-full h-1">
                  <div 
                    className="bg-white rounded-full h-1 transition-all duration-500"
                    style={{ width: `${stat.progress}%` }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Resumo Geral */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-card border border-border rounded-xl p-4"
      >
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-muted-foreground">Dias Perfeitos</p>
            <p className="font-semibold text-foreground">{stats.perfectDays}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Metas Mensais</p>
            <p className="font-semibold text-foreground">{stats.monthlyGoalsAchieved}/30</p>
          </div>
          <div>
            <p className="text-muted-foreground">Taxa de Sucesso</p>
            <p className={`font-semibold ${getCompletionColor(stats.averageCompletion)}`}>
              {stats.averageCompletion}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Dicas Baseadas nas Estatísticas */}
      {stats.totalDaysTracked > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
        >
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
            <TrendingUp size={16} />
            Insights do Seu Progresso
          </h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            {stats.averageCompletion < 70 && (
              <p>• Sua média de {stats.averageCompletion}% sugere que podemos ajustar sua meta diária</p>
            )}
            {stats.currentStreak >= 7 && (
              <p>• Incrível! {stats.currentStreak} dias seguidos é um ótimo hábito</p>
            )}
            {stats.totalGoalsAchieved / stats.totalDaysTracked > 0.8 && (
              <p>• Você atinge a meta em {(stats.totalGoalsAchieved / stats.totalDaysTracked * 100).toFixed(0)}% dos dias - impressionante!</p>
            )}
            {stats.totalWaterConsumed > 100000 && (
              <p>• Você já consumiu {formatWaterAmount(stats.totalWaterConsumed)} de água - isso é ótimo para sua saúde!</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Informação de atualização */}
      {autoLoad && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground">
            📊 Estatísticas atualizadas em tempo real
            {stats.totalDaysTracked > 0 && ` • Baseado em ${stats.totalDaysTracked} dias de dados`}
          </p>
        </motion.div>
      )}
    </div>
  );
}