import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Target, Zap, Crown, Star, Medal, Shield, Gem, Diamond, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { storageService, type UserStats } from '../../core/services/StorageService';

interface RankingStatsProps {
  autoLoad?: boolean;
  level?: number;
  xp?: number;
  consistency?: number;
  totalAchievements?: number;
  currentStreak?: number;
  bestStreak?: number;
  perfectDays?: number;
}

export function RankingStats({ 
  autoLoad = true,
  level = 1,
  xp = 0,
  consistency = 0,
  totalAchievements = 0,
  currentStreak = 0,
  bestStreak = 0,
  perfectDays = 0
}: RankingStatsProps) {
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    level,
    xp,
    consistency,
    totalAchievements,
    currentStreak,
    bestStreak,
    perfectDays
  });

  // Carregar dados do usuário se autoLoad estiver ativado
  useEffect(() => {
    if (!autoLoad) {
      setIsLoading(false);
      return;
    }

    const loadUserStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Carregar estatísticas do usuário
        const userStats = storageService.loadUserStats();
        
        // Calcular XP baseado no desempenho real
        const calculatedXP = calculateXPFromStats(userStats);
        
        // Calcular nível baseado no XP
        const calculatedLevel = calculateLevelFromXP(calculatedXP);
        
        // Calcular conquistas baseadas no histórico
        const calculatedAchievements = calculateAchievements(userStats);
        
        // Calcular dias perfeitos
        const calculatedPerfectDays = userStats.perfectDays;

        setStats({
          level: calculatedLevel,
          xp: calculatedXP,
          consistency: userStats.averageCompletion,
          totalAchievements: calculatedAchievements,
          currentStreak: userStats.currentStreak,
          bestStreak: userStats.bestStreak,
          perfectDays: calculatedPerfectDays
        });

      } catch (err) {
        console.error('Erro ao carregar estatísticas de ranking:', err);
        setError('Erro ao carregar dados de ranking');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserStats();
  }, [autoLoad]);

  // Calcular XP baseado nas estatísticas reais
  const calculateXPFromStats = (userStats: UserStats): number => {
    let xp = 0;
    
    // XP por dias rastreados
    xp += userStats.totalDaysTracked * 10;
    
    // XP por metas alcançadas
    xp += userStats.totalGoalsAchieved * 15;
    
    // XP por dias perfeitos
    xp += userStats.perfectDays * 25;
    
    // XP por sequências
    xp += userStats.currentStreak * 5;
    xp += userStats.bestStreak * 3;
    
    // Bônus por consistência
    if (userStats.averageCompletion > 80) {
      xp += Math.round(userStats.averageCompletion * 2);
    }
    
    return Math.max(0, xp);
  };

  // Calcular nível baseado no XP
  const calculateLevelFromXP = (xp: number): number => {
    return Math.max(1, Math.floor(xp / 100) + 1);
  };

  // Calcular conquistas baseadas no desempenho
  const calculateAchievements = (userStats: UserStats): number => {
    let achievements = 0;
    
    // Conquista por dias rastreados
    if (userStats.totalDaysTracked >= 7) achievements++;
    if (userStats.totalDaysTracked >= 30) achievements++;
    if (userStats.totalDaysTracked >= 90) achievements++;
    
    // Conquista por sequências
    if (userStats.currentStreak >= 3) achievements++;
    if (userStats.currentStreak >= 7) achievements++;
    if (userStats.currentStreak >= 30) achievements++;
    
    // Conquista por metas
    if (userStats.totalGoalsAchieved >= 10) achievements++;
    if (userStats.totalGoalsAchieved >= 50) achievements++;
    
    // Conquista por dias perfeitos
    if (userStats.perfectDays >= 5) achievements++;
    if (userStats.perfectDays >= 20) achievements++;
    
    // Conquista por consistência
    if (userStats.averageCompletion >= 80) achievements++;
    if (userStats.averageCompletion >= 90) achievements++;
    
    return achievements;
  };

  // Calcular posição estimada baseada no nível e consistência
  const calculateEstimatedRank = (level: number, consistency: number) => {
    const baseRank = Math.max(1, 1000 - (level * 45) - (consistency * 3));
    return Math.floor(baseRank);
  };

  // Calcular próxima meta de ranking
  const getNextRankingGoal = (level: number) => {
    if (level < 4) return { target: 'Liga Prata', needed: 'Alcance nível 4', progress: (level / 4) * 100 };
    if (level < 8) return { target: 'Liga Ouro', needed: 'Alcance nível 8', progress: ((level - 4) / 4) * 100 };
    if (level < 12) return { target: 'Liga Esmeralda', needed: 'Alcance nível 12', progress: ((level - 8) / 4) * 100 };
    if (level < 16) return { target: 'Liga Diamante', needed: 'Alcance nível 16', progress: ((level - 12) / 4) * 100 };
    return { target: 'Elite Máxima', needed: 'Você é uma lenda! 🏆', progress: 100 };
  };

  // Determinar divisão atual
  const getCurrentDivision = (level: number) => {
    if (level >= 16) return { 
      name: 'Elite Diamante', 
      icon: Diamond, 
      color: 'text-cyan-500', 
      gradient: 'from-cyan-500 to-blue-600',
      description: 'Mestre da Hidratação'
    };
    if (level >= 12) return { 
      name: 'Mestre Esmeralda', 
      icon: Gem, 
      color: 'text-emerald-500', 
      gradient: 'from-emerald-500 to-green-600',
      description: 'Hidratação Avançada'
    };
    if (level >= 8) return { 
      name: 'Campeão Ouro', 
      icon: Crown, 
      color: 'text-yellow-500', 
      gradient: 'from-yellow-500 to-amber-600',
      description: 'Comprometido com a Saúde'
    };
    if (level >= 4) return { 
      name: 'Guerreiro Prata', 
      icon: Shield, 
      color: 'text-gray-400', 
      gradient: 'from-gray-400 to-gray-600',
      description: 'Em Desenvolvimento'
    };
    return { 
      name: 'Explorador Bronze', 
      icon: Medal, 
      color: 'text-orange-500', 
      gradient: 'from-amber-600 to-orange-600',
      description: 'Iniciando a Jornada'
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando ranking...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-center text-destructive">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const estimatedRank = calculateEstimatedRank(stats.level, stats.consistency);
  const nextGoal = getNextRankingGoal(stats.level);
  const division = getCurrentDivision(stats.level);

  const statCards = [
    {
      label: 'Posição Estimada',
      value: `#${estimatedRank.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-blue-500',
      description: 'Entre todos os usuários'
    },
    {
      label: 'Pontuação Total',
      value: stats.xp.toLocaleString(),
      icon: Star,
      color: 'text-purple-500',
      description: 'XP acumulado'
    },
    {
      label: 'Taxa de Sucesso',
      value: `${Math.round(stats.consistency)}%`,
      icon: Target,
      color: 'text-green-500',
      description: 'Média de conclusão'
    },
    {
      label: 'Melhor Sequência',
      value: `${stats.bestStreak} dias`,
      icon: Zap,
      color: 'text-orange-500',
      description: 'Recorde pessoal'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Card da Divisão Atual */}
      <motion.div 
        className={`bg-gradient-to-br ${division.gradient} rounded-2xl p-6 text-white relative overflow-hidden`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Efeito de brilho */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -skew-x-12 transform opacity-50"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">Divisão {division.name}</h3>
              <p className="text-white/80">{division.description}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
              <division.icon className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm border border-white/20">
              <p className="text-sm text-white/80">Troféus</p>
              <p className="text-2xl font-bold">{stats.totalAchievements}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm border border-white/20">
              <p className="text-sm text-white/80">Sequência Atual</p>
              <p className="text-2xl font-bold">{stats.currentStreak}</p>
            </div>
          </div>

          {/* Barra de progresso do nível */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-white/80 mb-1">
              <span>Nível {stats.level}</span>
              <span>{stats.xp} XP</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${(stats.xp % 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Estatísticas Detalhadas */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="bg-card rounded-xl p-4 border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Próxima Meta */}
      <motion.div 
        className="bg-card rounded-xl p-4 border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h4 className="font-semibold text-foreground">Próxima Meta</h4>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{nextGoal.target}</p>
              <p className="text-sm text-muted-foreground">{nextGoal.needed}</p>
            </div>
            {stats.level < 16 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Progresso</p>
                <p className="text-sm font-medium text-primary">
                  {Math.round(nextGoal.progress)}%
                </p>
              </div>
            )}
          </div>
          
          {/* Barra de progresso da meta */}
          {stats.level < 16 && (
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-amber-500 rounded-full h-2 transition-all duration-500"
                style={{ width: `${nextGoal.progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Dicas de Melhoria */}
      <motion.div 
        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
          <Star className="w-4 h-4" />
          Dicas para Subir no Ranking
        </h4>
        
        <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
          {stats.consistency < 80 && (
            <p>• Mantenha consistência acima de 80% para bônus de ranking</p>
          )}
          {stats.currentStreak < 7 && (
            <p>• Construa sequências longas para ganhar mais XP</p>
          )}
          {stats.perfectDays < 10 && (
            <p>• Dias perfeitos (100% da meta) dão XP extra</p>
          )}
          <p>• Complete conquistas raras para grandes ganhos de XP</p>
          {stats.level < 8 && (
            <p>• Mantenha-se hidratado todos os dias para subir rápido</p>
          )}
        </div>
      </motion.div>

      {/* Estatísticas Avançadas */}
      <motion.div
        className="bg-card rounded-xl p-4 border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h4 className="font-semibold text-foreground mb-3">Detalhes do Progresso</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-muted-foreground">Dias Perfeitos</p>
            <p className="font-semibold text-foreground">{stats.perfectDays}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-muted-foreground">Metas Alcançadas</p>
            <p className="font-semibold text-foreground">{Math.round(stats.consistency / 100 * stats.currentStreak)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-muted-foreground">XP por Dia</p>
            <p className="font-semibold text-foreground">{Math.round(stats.xp / Math.max(1, stats.currentStreak))}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-muted-foreground">Próximo Nível</p>
            <p className="font-semibold text-foreground">{100 - (stats.xp % 100)} XP</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}