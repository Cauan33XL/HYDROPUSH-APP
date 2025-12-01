import React, { useState, useEffect } from 'react';
import { Droplets, Clock, Sun, Moon, Activity, Sparkles, TrendingUp, LucideProps } from 'lucide-react';
import { motion, useAnimation } from 'motion/react';
import { storageService } from '../../core/services/StorageService';
import { Skeleton } from '../../shared/components/ui/skeleton';

interface Tip {
  id: string;
  title: string;
  content: string;
  icon: React.ComponentType<LucideProps>;
  type: 'performance' | 'general' | 'motivational';
}

export function TipsView() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para dados do usuário
  const [userStats, setUserStats] = useState({
    averageCompletion: 0,
    currentStreak: 0,
    totalDaysTracked: 0
  });
  const [currentAmount, setCurrentAmount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2000);

  // Carregar dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Carregar meta diária
        const goal = storageService.loadDailyGoal();
        setDailyGoal(goal);

        // Carregar entradas do dia atual
        const today = new Date().toLocaleDateString('en-CA');
        const todayEntries = storageService.loadHydrationEntries(today);
        const amount = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
        setCurrentAmount(amount);

        // Carregar estatísticas do usuário
        const stats = storageService.calculateUserStats();
        setUserStats({
          averageCompletion: stats.averageCompletion,
          currentStreak: stats.currentStreak,
          totalDaysTracked: stats.totalDaysTracked
        });

      } catch (err) {
        console.error('Erro ao carregar dados para dicas:', err);
        setError('Erro ao carregar dados. Tente recarregar a página.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();

    // ✅ Listener para sincronizar meta diária quando mudar
    const unsubscribeGoal = storageService.subscribe('user_daily_goal', (newGoal) => {
      if (newGoal && typeof newGoal === 'number') {
        setDailyGoal(newGoal);
      }
    });

    // ✅ Atualizar currentAmount periodicamente para refletir água adicionada
    const refreshInterval = setInterval(() => {
      const today = new Date().toLocaleDateString('en-CA');
      const todayEntries = storageService.loadHydrationEntries(today);
      const amount = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
      setCurrentAmount(amount);

      // Também atualizar estatísticas
      const stats = storageService.calculateUserStats();
      setUserStats({
        averageCompletion: stats.averageCompletion,
        currentStreak: stats.currentStreak,
        totalDaysTracked: stats.totalDaysTracked
      });
    }, 5000); // Atualizar a cada 5 segundos

    return () => {
      unsubscribeGoal();
      clearInterval(refreshInterval);
    };
  }, []);



  // Calcular performance do usuário
  const averageCompletion = userStats.averageCompletion;
  const currentStreak = userStats.currentStreak;
  const todayPercentage = (currentAmount / dailyGoal) * 100;

  // Dicas baseadas na performance
  const getPerformanceTips = (): Tip[] => {
    const tips: Tip[] = [];

    if (averageCompletion < 70) {
      tips.push({
        id: 'low_performance',
        title: 'Vamos melhorar juntos! 💪',
        content: 'Que tal começar com metas menores? Tente beber um copo d\'água a cada hora durante o dia.',
        icon: Activity,
        type: 'performance'
      });
    }

    if (currentStreak === 0 && userStats.totalDaysTracked > 3) {
      tips.push({
        id: 'break_streak',
        title: 'Recomeçar é parte do processo 🌱',
        content: 'Todo mundo tem dias difíceis. O importante é não desistir! Comece hoje com um copo d\'água.',
        icon: Sun,
        type: 'motivational'
      });
    }

    if (todayPercentage < 30) {
      const timeOfDay = new Date().getHours();
      if (timeOfDay >= 12) {
        tips.push({
          id: 'catch_up',
          title: 'Hora de acelerar! ⚡',
          content: 'Você ainda tem tempo para alcançar sua meta hoje. Que tal beber 2 copos de água agora?',
          icon: Clock,
          type: 'performance'
        });
      }
    }

    return tips;
  };

  // Dicas gerais
  const getGeneralTips = (): Tip[] => [
    {
      id: 'morning_water',
      title: 'Comece o dia hidratado! 🌅',
      content: 'Beba um copo d\'água logo ao acordar. Seu corpo perdeu água durante o sono e precisa se reidratar.',
      icon: Sun,
      type: 'general'
    },
    {
      id: 'before_meals',
      title: 'Água antes das refeições 🍽️',
      content: 'Beber água 30 minutos antes das refeições pode ajudar na digestão e controlar o apetite.',
      icon: Clock,
      type: 'general'
    },
    {
      id: 'bottle_nearby',
      title: 'Mantenha uma garrafa por perto 💧',
      content: 'Ter água sempre visível é um lembrete visual poderoso. Use uma garrafa transparente para ver o nível.',
      icon: Droplets,
      type: 'general'
    },
    {
      id: 'temperature_matters',
      title: 'Temperatura ideal da água 🌡️',
      content: 'Água em temperatura ambiente é absorvida mais rapidamente pelo corpo do que água muito gelada.',
      icon: Activity,
      type: 'general'
    },
    {
      id: 'exercise_hydration',
      title: 'Hidratação e exercícios 🏃‍♂️',
      content: 'Beba 500ml de água 2 horas antes do exercício e continue se hidratando durante a atividade.',
      icon: Activity,
      type: 'general'
    },
    {
      id: 'sleep_hydration',
      title: 'Hidratação noturna 🌙',
      content: 'Evite beber muita água 2 horas antes de dormir para não interromper o sono, mas mantenha-se hidratado.',
      icon: Moon,
      type: 'general'
    }
  ];

  const performanceTips = getPerformanceTips();
  const generalTips = getGeneralTips();

  // Priorizar dicas de performance, depois gerais
  const allTips = [...performanceTips, ...generalTips];

  const getTypeColor = (type: Tip['type']) => {
    switch (type) {
      case 'performance':
        return {
          gradient: 'from-orange-500/20 via-red-500/10 to-pink-500/20',
          border: 'border-orange-200/50 dark:border-orange-800/50',
          glow: 'shadow-lg shadow-orange-500/20',
          accent: 'text-orange-600 dark:text-orange-400'
        };
      case 'motivational':
        return {
          gradient: 'from-emerald-500/20 via-green-500/10 to-teal-500/20',
          border: 'border-emerald-200/50 dark:border-emerald-800/50',
          glow: 'shadow-lg shadow-emerald-500/20',
          accent: 'text-emerald-600 dark:text-emerald-400'
        };
      default:
        return {
          gradient: 'from-blue-500/20 via-cyan-500/10 to-sky-500/20',
          border: 'border-blue-200/50 dark:border-blue-800/50',
          glow: 'shadow-lg shadow-blue-500/20',
          accent: 'text-blue-600 dark:text-blue-400'
        };
    }
  };

  const sparkleControls = useAnimation();

  useEffect(() => {
    sparkleControls.start({
      rotate: [0, 360],
      scale: [1, 1.2, 1],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    });
  }, [sparkleControls]);



  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>

        {/* Tips Cards Skeleton */}
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card p-6 rounded-2xl border border-border">
              <div className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-center text-destructive">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-primary hover:underline rounded-md"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            animate={sparkleControls}
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Dicas Inteligentes
            </h1>
            <p className="text-muted-foreground text-sm">
              Personalizadas para você
            </p>
          </div>
        </div>
      </motion.div>

      {/* Dicas Cards - Layout Melhorado */}
      <motion.div
        className="grid gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {allTips.slice(0, 6).map((tip, index) => {
          const colors = getTypeColor(tip.type);
          return (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`bg-gradient-to-br ${colors.gradient} p-6 rounded-2xl border ${colors.border} relative overflow-hidden group cursor-pointer`}
            >
              {/* Efeito de brilho */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />

              <div className="flex gap-4 relative z-10">
                <motion.div
                  className={`w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 ${colors.border}`}
                  whileHover={{ rotate: 5, scale: 1.1 }}
                >
                  <tip.icon className={`w-6 h-6 ${colors.accent}`} />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground mb-2 text-lg">
                    {tip.title}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {tip.content}
                  </p>

                  <div className="flex items-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${tip.type === 'performance' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                      tip.type === 'motivational' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                      {tip.type === 'performance' ? 'Performance' :
                        tip.type === 'motivational' ? 'Motivação' : 'Geral'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Estatísticas de Dicas */}
      <motion.div
        className="bg-gradient-to-br from-muted/50 to-muted/30 p-6 rounded-2xl border border-border/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center"
          >
            <TrendingUp className="w-4 h-4 text-white" />
          </motion.div>
          <h3 className="font-semibold text-foreground">Resumo das Dicas</h3>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-card/50 rounded-xl p-3">
            <p className="text-lg font-bold text-primary">{performanceTips.length}</p>
            <p className="text-xs text-muted-foreground">Performance</p>
          </div>
          <div className="bg-card/50 rounded-xl p-3">
            <p className="text-lg font-bold text-emerald-600">{generalTips.length}</p>
            <p className="text-xs text-muted-foreground">Gerais</p>
          </div>
          <div className="bg-card/50 rounded-xl p-3">
            <p className="text-lg font-bold text-purple-600">{allTips.length}</p>
            <p className="text-xs text-muted-foreground">Filtradas</p>
          </div>
        </div>
      </motion.div>

      {/* Dashboard Rápido */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-card to-card/80 p-6 rounded-2xl border border-border/50 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center"
          >
            <Droplets className="w-4 h-4 text-white" />
          </motion.div>
          <h3 className="font-semibold text-foreground">Progresso de Hoje</h3>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{Math.round(todayPercentage)}%</p>
            <p className="text-xs text-muted-foreground">Meta Alcançada</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{currentAmount}ml</p>
            <p className="text-xs text-muted-foreground">Consumido Hoje</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">Dias Seguidos</p>
          </div>
        </div>

        {/* Barra de progresso simples */}
        <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(todayPercentage, 100)}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}