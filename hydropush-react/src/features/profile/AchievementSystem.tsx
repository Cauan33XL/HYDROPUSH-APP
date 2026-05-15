import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Star, Calendar, Crown, Medal, Shield, Gem, Droplets, Diamond, Flame, TrendingUp, Users, Heart, LucideProps } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storageService, type HydrationDay } from '../../core/services/StorageService';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<LucideProps>;
  xp: number;
  trophy: 'bronze' | 'silver' | 'gold' | 'emerald' | 'diamond';
  category: 'hydration' | 'consistency' | 'milestones' | 'special' | 'mastery';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface UserProgressStats {
  totalDaysTracked: number;
  currentStreak: number;
  bestStreak: number;
  totalWaterConsumed: number;
  perfectDays: number;
  monthlyGoalsAchieved: number;
  totalGoalsAchieved: number;
  averageCompletion: number;
}

interface AchievementSystemProps {
  onXpGained?: (xp: number) => void;
}

// Sistema de XP por nível otimizado para progressão mais rápida
const LEVEL_XP_REQUIREMENTS = [
  0,      // Nível 1 (Bronze)
  50,     // Nível 2 
  120,    // Nível 3
  220,    // Nível 4 (Prata)
  350,    // Nível 5
  520,    // Nível 6
  730,    // Nível 7
  980,    // Nível 8 (Ouro)
  1270,   // Nível 9
  1600,   // Nível 10
  1970,   // Nível 11
  2380,   // Nível 12 (Esmeralda)
  2830,   // Nível 13
  3320,   // Nível 14
  3850,   // Nível 15
  4420,   // Nível 16 (Diamante)
  5030,   // Nível 17
  5680,   // Nível 18
  6370,   // Nível 19
  7100,   // Nível 20 (Máximo)
];

const MAX_LEVEL = 20;

// Sistema de Ligas/Ranking mais inteligente - COMEÇANDO NO BRONZE
const getLeagueInfo = (level: number, xp: number, consistency: number) => {
  const consistencyBonus = consistency > 80 ? 1 : consistency > 60 ? 0.5 : 0;
  const adjustedLevel = level + consistencyBonus;

  if (adjustedLevel >= 16) return {
    name: 'Liga Diamante',
    tier: 'DIAMANTE',
    emoji: '💎',
    icon: Diamond,
    gradient: 'from-cyan-400 via-blue-500 to-purple-600',
    description: 'Elite dos hidratados',
    minLevel: 16,
    effects: 'shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-400/50'
  };
  if (adjustedLevel >= 12) return {
    name: 'Liga Esmeralda',
    tier: 'ESMERALDA',
    emoji: '💚',
    icon: Gem,
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
    description: 'Mestres da hidratação',
    minLevel: 12,
    effects: 'shadow-xl shadow-emerald-500/30 ring-2 ring-emerald-400/50'
  };
  if (adjustedLevel >= 8) return {
    name: 'Liga Ouro',
    tier: 'OURO',
    emoji: '🥇',
    icon: Crown,
    gradient: 'from-yellow-400 via-yellow-500 to-amber-600',
    description: 'Campeões consistentes',
    minLevel: 8,
    effects: 'shadow-lg shadow-yellow-500/30 ring-2 ring-yellow-400/50'
  };
  if (adjustedLevel >= 4) return {
    name: 'Liga Prata',
    tier: 'PRATA',
    emoji: '🥈',
    icon: Shield,
    gradient: 'from-gray-300 via-gray-400 to-gray-600',
    description: 'Guerreiros dedicados',
    minLevel: 4,
    effects: 'shadow-md shadow-gray-500/30 ring-2 ring-gray-400/50'
  };

  // SEMPRE COMEÇAR NO BRONZE - nunca abaixo disso
  return {
    name: 'Liga Bronze',
    tier: 'BRONZE',
    emoji: '🥉',
    icon: Medal,
    gradient: 'from-amber-500 via-orange-500 to-orange-700',
    description: 'Exploradores determinados',
    minLevel: 1,
    effects: 'shadow-md shadow-amber-500/30 ring-2 ring-amber-400/50'
  };
};

// Ícones e cores por troféu
const getTrophyIcon = (trophy: string) => {
  switch (trophy) {
    case 'bronze': return { emoji: '🥉', color: 'from-amber-500 to-orange-600' };
    case 'silver': return { emoji: '🥈', color: 'from-gray-400 to-gray-600' };
    case 'gold': return { emoji: '🥇', color: 'from-yellow-400 to-yellow-600' };
    case 'emerald': return { emoji: '💚', color: 'from-emerald-400 to-green-600' };
    case 'diamond': return { emoji: '💎', color: 'from-cyan-400 to-blue-600' };
    default: return { emoji: '🏆', color: 'from-blue-400 to-blue-600' };
  }
};

// Cores por raridade
const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'Common': return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    case 'Rare': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700';
    case 'Epic': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700';
    case 'Legendary': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700';
    case 'Mythic': return 'bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-gradient';
    default: return 'bg-gray-100 dark:bg-gray-800';
  }
};

export function AchievementSystem({ onXpGained }: AchievementSystemProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserProgressStats>({
    totalDaysTracked: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalWaterConsumed: 0,
    perfectDays: 0,
    monthlyGoalsAchieved: 0,
    totalGoalsAchieved: 0,
    averageCompletion: 0
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados do storageService
  useEffect(() => {
    const loadUserData = () => {
      try {
        const history = storageService.loadHydrationHistory();
        calculateStatsFromHistory(history);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const calculateStatsFromHistory = (history: HydrationDay[]) => {
    const stats = storageService.calculateUserStats(history);
    setUserStats(stats);
  };

  // Definir todas as conquistas organizadas por categoria
  const getAllAchievements = useCallback((): Achievement[] => [
    // HIDRATAÇÃO BÁSICA (Bronze/Prata)
    {
      id: 'first_drop',
      title: 'Primeira Gota',
      description: 'Complete sua primeira meta diária',
      icon: Droplets,
      xp: 50,
      trophy: 'bronze',
      category: 'hydration',
      rarity: 'Common',
      unlocked: userStats.totalGoalsAchieved >= 1,
      progress: Math.min(userStats.totalGoalsAchieved, 1),
      maxProgress: 1
    },
    {
      id: 'water_warrior',
      title: 'Guerreiro da Água',
      description: 'Complete 5 metas diárias',
      icon: Shield,
      xp: 100,
      trophy: 'bronze',
      category: 'hydration',
      rarity: 'Common',
      unlocked: userStats.totalGoalsAchieved >= 5,
      progress: Math.min(userStats.totalGoalsAchieved, 5),
      maxProgress: 5
    },
    {
      id: 'hydration_hero',
      title: 'Herói da Hidratação',
      description: 'Complete 15 metas diárias',
      icon: Heart,
      xp: 200,
      trophy: 'silver',
      category: 'hydration',
      rarity: 'Rare',
      unlocked: userStats.totalGoalsAchieved >= 15,
      progress: Math.min(userStats.totalGoalsAchieved, 15),
      maxProgress: 15
    },

    // CONSISTÊNCIA (Sequências)
    {
      id: 'bronze_streak',
      title: 'Sequência Bronze',
      description: 'Complete 3 dias seguidos',
      icon: Flame,
      xp: 75,
      trophy: 'bronze',
      category: 'consistency',
      rarity: 'Common',
      unlocked: userStats.currentStreak >= 3,
      progress: Math.min(userStats.currentStreak, 3),
      maxProgress: 3
    },
    {
      id: 'silver_streak',
      title: 'Sequência Prata',
      description: 'Complete 7 dias seguidos',
      icon: TrendingUp,
      xp: 150,
      trophy: 'silver',
      category: 'consistency',
      rarity: 'Rare',
      unlocked: userStats.currentStreak >= 7,
      progress: Math.min(userStats.currentStreak, 7),
      maxProgress: 7
    },
    {
      id: 'gold_streak',
      title: 'Sequência Ouro',
      description: 'Complete 14 dias seguidos',
      icon: Crown,
      xp: 300,
      trophy: 'gold',
      category: 'consistency',
      rarity: 'Epic',
      unlocked: userStats.currentStreak >= 14,
      progress: Math.min(userStats.currentStreak, 14),
      maxProgress: 14
    },
    {
      id: 'emerald_master',
      title: 'Mestre Esmeralda',
      description: 'Complete 21 dias seguidos',
      icon: Gem,
      xp: 500,
      trophy: 'emerald',
      category: 'consistency',
      rarity: 'Legendary',
      unlocked: userStats.currentStreak >= 21,
      progress: Math.min(userStats.currentStreak, 21),
      maxProgress: 21
    },
    {
      id: 'diamond_legend',
      title: 'Lenda Diamante',
      description: 'Complete 30 dias seguidos',
      icon: Diamond,
      xp: 750,
      trophy: 'diamond',
      category: 'consistency',
      rarity: 'Mythic',
      unlocked: userStats.currentStreak >= 30,
      progress: Math.min(userStats.currentStreak, 30),
      maxProgress: 30
    },

    // MARCOS E CONQUISTAS ESPECIAIS
    {
      id: 'perfect_week',
      title: 'Semana Perfeita',
      description: '7 dias perfeitos de hidratação',
      icon: Star,
      xp: 200,
      trophy: 'gold',
      category: 'milestones',
      rarity: 'Epic',
      unlocked: userStats.perfectDays >= 7,
      progress: Math.min(userStats.perfectDays, 7),
      maxProgress: 7
    },
    {
      id: 'month_champion',
      title: 'Campeão do Mês',
      description: 'Complete todas as metas de um mês',
      icon: Calendar,
      xp: 400,
      trophy: 'emerald',
      category: 'milestones',
      rarity: 'Legendary',
      unlocked: userStats.monthlyGoalsAchieved >= 30,
      progress: Math.min(userStats.monthlyGoalsAchieved, 30),
      maxProgress: 30
    },

    // CONQUISTAS DE MAESTRIA
    {
      id: 'hydration_veteran',
      title: 'Veterano da Hidratação',
      description: '50 dias de tracking completo',
      icon: Medal,
      xp: 300,
      trophy: 'silver',
      category: 'mastery',
      rarity: 'Epic',
      unlocked: userStats.totalDaysTracked >= 50,
      progress: Math.min(userStats.totalDaysTracked, 50),
      maxProgress: 50
    },
    {
      id: 'hydration_master',
      title: 'Mestre da Hidratação',
      description: '100 dias de tracking completo',
      icon: Crown,
      xp: 600,
      trophy: 'gold',
      category: 'mastery',
      rarity: 'Legendary',
      unlocked: userStats.totalDaysTracked >= 100,
      progress: Math.min(userStats.totalDaysTracked, 100),
      maxProgress: 100
    },

    // CONQUISTAS ESPECIAIS
    {
      id: 'consistency_king',
      title: 'Rei da Consistência',
      description: 'Média de 90%+ por 30 dias',
      icon: Users,
      xp: 500,
      trophy: 'diamond',
      category: 'special',
      rarity: 'Mythic',
      unlocked: userStats.averageCompletion >= 90 && userStats.totalDaysTracked >= 30,
      progress: userStats.averageCompletion >= 90 && userStats.totalDaysTracked >= 30 ? 1 : 0,
      maxProgress: 1
    }
  ], [userStats]);

  // Calcular XP total e nível
  useEffect(() => {
    const allAchievements = getAllAchievements();

    setAchievements(previousAchievements => {
      const updatedAchievements = allAchievements.map(achievement => {
        const existing = previousAchievements.find(a => a.id === achievement.id);
        if (achievement.unlocked && (!existing || !existing.unlocked)) {
          return {
            ...achievement,
            unlockedAt: new Date().toISOString()
          };
        }
        return achievement;
      });

      // Encontrar conquistas recém-desbloqueadas
      const newUnlocked = updatedAchievements.filter(achievement =>
        achievement.unlocked &&
        !previousAchievements.find(a => a.id === achievement.id && a.unlocked)
      );

      if (newUnlocked.length > 0) {
        setNewlyUnlocked(newUnlocked);
        const totalXPGained = newUnlocked.reduce((sum, a) => sum + a.xp, 0);
        onXpGained?.(totalXPGained);
        setTimeout(() => setNewlyUnlocked([]), 4000);
      }

      return updatedAchievements;
    });
  }, [userStats, getAllAchievements, onXpGained]);

  // Calcular nível atual e XP
  const currentXP = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0);

  const calculateCurrentLevel = () => {
    let level = 1;
    for (let i = 0; i < LEVEL_XP_REQUIREMENTS.length; i++) {
      if (currentXP >= LEVEL_XP_REQUIREMENTS[i]) {
        level = i + 1;
      } else {
        break;
      }
    }
    return Math.min(level, MAX_LEVEL);
  };

  const currentLevel = calculateCurrentLevel();

  const getXPForNextLevel = (level: number) => {
    return level < MAX_LEVEL ? LEVEL_XP_REQUIREMENTS[level] : LEVEL_XP_REQUIREMENTS[MAX_LEVEL - 1];
  };

  const getProgressToNextLevel = () => {
    if (currentLevel >= MAX_LEVEL) return 100;

    const currentLevelXP = LEVEL_XP_REQUIREMENTS[currentLevel - 1];
    const nextLevelXP = getXPForNextLevel(currentLevel);
    const progressXP = currentXP - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;

    return Math.min((progressXP / neededXP) * 100, 100);
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const consistency = userStats.totalDaysTracked > 0 ? userStats.averageCompletion : 0;
  const leagueInfo = getLeagueInfo(currentLevel, currentXP, consistency);

  // Filtrar conquistas por categoria
  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'Todas', icon: Trophy },
    { id: 'hydration', name: 'Hidratação', icon: Droplets },
    { id: 'consistency', name: 'Consistência', icon: Flame },
    { id: 'milestones', name: 'Marcos', icon: Star },
    { id: 'mastery', name: 'Maestria', icon: Crown },
    { id: 'special', name: 'Especiais', icon: Gem },
  ];

  // Estado de loading
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-card rounded-2xl p-6 h-32"></div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-3 h-20"></div>
          ))}
        </div>
        <div className="bg-card rounded-2xl p-6 h-64"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card da Liga - Sistema mais inteligente com efeitos */}
      <motion.div
        className={`bg-gradient-to-br ${leagueInfo.gradient} rounded-2xl p-6 text-white relative overflow-hidden ${leagueInfo.effects}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        {/* Background pattern com efeitos */}
        <div className="absolute inset-0 opacity-10">
          <motion.div
            className="absolute top-4 right-4 text-6xl font-bold"
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {leagueInfo.emoji}
          </motion.div>

          {/* Efeitos de partículas para níveis altos */}
          {currentLevel >= 12 && (
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [-10, -30, -10],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">Nível {currentLevel}</h3>
              <p className="text-white/90 font-medium">{leagueInfo.name}</p>
              <p className="text-white/70 text-sm">{leagueInfo.description}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <leagueInfo.icon className="w-8 h-8 text-white" />
            </div>
          </div>

          {currentLevel < MAX_LEVEL && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso para o próximo nível</span>
                <span className="font-semibold">{currentXP} / {getXPForNextLevel(currentLevel)} XP</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="bg-white h-3 rounded-full relative overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressToNextLevel()}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  {/* Efeito de brilho na barra de progresso */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    animate={{ x: [-100, 200] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                      delay: 1
                    }}
                  />
                </motion.div>
              </div>
              <div className="flex justify-between text-xs mt-1 opacity-80">
                <span>Nível {currentLevel}</span>
                <span>Nível {currentLevel + 1}</span>
              </div>
            </div>
          )}

          {currentLevel >= MAX_LEVEL && (
            <motion.div
              className="mb-4 text-center"
              animate={{
                scale: [1, 1.02, 1],
                textShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 20px rgba(255,255,255,0.8)", "0 0 0px rgba(255,255,255,0)"]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <p className="text-lg font-semibold">🏆 NÍVEL MÁXIMO ALCANÇADO! 🏆</p>
              <p className="text-white/80 text-sm">Você é uma lenda da hidratação!</p>
              <motion.div
                className="text-2xl mt-2"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                ✨💎✨
              </motion.div>
            </motion.div>
          )}

          {currentLevel >= 16 && currentLevel < MAX_LEVEL && (
            <motion.div
              className="mb-4 text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-sm font-semibold">💎 LIGA DIAMANTE 💎</p>
              <p className="text-white/80 text-xs">Você está entre a elite!</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats expandidas */}
      <div className="grid grid-cols-4 gap-3">
        <motion.div className="bg-card rounded-xl p-3 text-center border border-border" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{unlockedCount}</p>
          <p className="text-xs text-muted-foreground">Troféus</p>
        </motion.div>

        <motion.div className="bg-card rounded-xl p-3 text-center border border-border" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Star className="w-6 h-6 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{currentXP}</p>
          <p className="text-xs text-muted-foreground">XP Total</p>
        </motion.div>

        <motion.div className="bg-card rounded-xl p-3 text-center border border-border" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Flame className="w-6 h-6 text-red-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{userStats.currentStreak}</p>
          <p className="text-xs text-muted-foreground">Sequência</p>
        </motion.div>

        <motion.div className="bg-card rounded-xl p-3 text-center border border-border" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{consistency}%</p>
          <p className="text-xs text-muted-foreground">Média</p>
        </motion.div>
      </div>

      {/* Filtros por categoria */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <motion.button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === category.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            whileTap={{ scale: 0.95 }}
          >
            <category.icon size={16} />
            {category.name}
          </motion.button>
        ))}
      </div>

      {/* Lista de Conquistas organizadas */}
      <motion.div
        className="bg-card rounded-2xl border border-border overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
          <div className="flex items-center justify-between text-white">
            <h4 className="font-semibold flex items-center gap-2">
              <Trophy size={20} />
              Conquistas ({filteredAchievements.filter(a => a.unlocked).length}/{filteredAchievements.length})
            </h4>
          </div>
        </div>

        <div className="p-4">
          {filteredAchievements.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Nenhuma conquista encontrada</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Mude a categoria ou continue hidratando-se para desbloquear conquistas
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredAchievements.map((achievement) => {
                const trophyInfo = getTrophyIcon(achievement.trophy);
                const rarityStyle = getRarityColor(achievement.rarity);

                return (
                  <motion.div
                    key={achievement.id}
                    className={`p-4 rounded-xl border-2 transition-all ${achievement.unlocked
                        ? rarityStyle
                        : 'bg-muted/30 border-muted opacity-60'
                      }`}
                    whileHover={{ scale: achievement.unlocked ? 1.02 : 1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${achievement.unlocked
                          ? `bg-gradient-to-br ${trophyInfo.color}`
                          : 'bg-muted'
                        }`}>
                        {achievement.unlocked ? (
                          <span className="text-lg">{trophyInfo.emoji}</span>
                        ) : (
                          <achievement.icon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-foreground">
                            {achievement.title}
                          </h5>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              +{achievement.xp} XP
                            </span>
                            {achievement.unlocked && (
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                ✓
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mt-1">
                          {achievement.description}
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${achievement.rarity === 'Common' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                                achievement.rarity === 'Rare' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200' :
                                  achievement.rarity === 'Epic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200' :
                                    achievement.rarity === 'Legendary' ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200' :
                                      'bg-gradient-to-r from-pink-100 to-purple-100 text-purple-800 dark:from-pink-800 dark:to-purple-800 dark:text-purple-200'
                              }`}>
                              {achievement.rarity}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${achievement.trophy === 'bronze' ? 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-200' :
                                achievement.trophy === 'silver' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                                  achievement.trophy === 'gold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' :
                                    achievement.trophy === 'emerald' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' :
                                      'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                              }`}>
                              {achievement.trophy.toUpperCase()}
                            </span>
                          </div>

                          {achievement.maxProgress && achievement.maxProgress > 1 && (
                            <div className="text-xs text-muted-foreground">
                              {achievement.progress || 0}/{achievement.maxProgress}
                            </div>
                          )}
                        </div>

                        {/* Barra de progresso */}
                        {achievement.maxProgress && achievement.maxProgress > 1 && (
                          <div className="mt-2">
                            <div className="w-full bg-muted/30 rounded-full h-2">
                              <motion.div
                                className="bg-primary h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(((achievement.progress || 0) / achievement.maxProgress) * 100, 100)}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Notificações aprimoradas */}
      <AnimatePresence>
        {newlyUnlocked.map((achievement) => {
          const trophyInfo = getTrophyIcon(achievement.trophy);
          return (
            <motion.div
              key={`notification-${achievement.id}`}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto"
            >
              <div className={`bg-gradient-to-r ${trophyInfo.color} p-4 rounded-xl shadow-lg text-white border-2 border-white/20`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg">
                    {trophyInfo.emoji}
                  </div>
                  <div>
                    <p className="font-semibold">🎉 Novo Troféu {achievement.trophy.toUpperCase()}!</p>
                    <p className="text-sm opacity-90">{achievement.title}</p>
                    <p className="text-xs opacity-75">+{achievement.xp} XP • {achievement.rarity}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}