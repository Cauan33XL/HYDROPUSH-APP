import React, { useState, useEffect } from 'react';
import { Calendar, Droplets, TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MonthlyCalendar } from './MonthlyCalendar';
import { storageService } from '../../core/services/StorageService';
import { toast } from 'sonner';

interface HistoryEntry {
  date: string;
  amount: number; // em ml
  goal: number; // em ml
}

export function HistoryView() {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getViewModeLabel = (mode: 'daily' | 'weekly' | 'monthly') => {
    switch (mode) {
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      default: return mode;
    }
  };

  // Carregar histórico do storageService
  useEffect(() => {
    const loadHistory = () => {
      try {
        const hydrationHistory = storageService.loadHydrationHistory();

        // Converter HydrationDay para HistoryEntry
        const formattedHistory: HistoryEntry[] = hydrationHistory.map(day => ({
          date: day.date,
          amount: day.amount,
          goal: day.goal
        }));

        // Ordenar por data (mais recente primeiro)
        const sortedHistory = formattedHistory.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setHistory(sortedHistory);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
    if (percentage >= 80) return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  };

  const getProgressWidth = (percentage: number) => {
    return Math.min(percentage, 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const getWeeklyStats = () => {
    const weekData = history.slice(0, 7);
    const totalAmount = weekData.reduce((sum, entry) => sum + entry.amount, 0);
    const totalGoal = weekData.reduce((sum, entry) => sum + entry.goal, 0);
    const averagePercentage = totalGoal > 0 ? Math.round((totalAmount / totalGoal) * 100) : 0;
    const perfectDays = weekData.filter(entry => entry.amount >= entry.goal * 0.9).length; // 90% da meta

    return {
      totalAmount: Math.round(totalAmount),
      averagePercentage,
      perfectDays,
      totalDays: weekData.length,
      averageDaily: weekData.length > 0 ? Math.round(totalAmount / weekData.length) : 0
    };
  };

  const getChartData = () => {
    return history.slice(0, 7).reverse().map(entry => ({
      date: new Date(entry.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      amount: entry.amount,
      goal: entry.goal,
      percentage: entry.goal > 0 ? Math.round((entry.amount / entry.goal) * 100) : 0
    }));
  };

  const weeklyStats = getWeeklyStats();
  const chartData = getChartData();

  // Estado vazio
  if (isLoading) {
    return (
      <div className="px-6 py-4 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Histórico</h1>
          <p className="text-muted-foreground mt-1">Carregando seus dados...</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card p-5 rounded-2xl border border-border">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sem dados
  if (history.length === 0) {
    return (
      <div className="px-6 py-4 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Histórico</h1>
          <p className="text-muted-foreground mt-1">Acompanhe seu progresso ao longo do tempo</p>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum dado de histórico
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Seu histórico de hidratação aparecerá aqui conforme você for registrando seu consumo diário de água.
          </p>
          <div className="bg-card/50 p-6 rounded-2xl border border-border max-w-md mx-auto">
            <h4 className="font-semibold text-foreground mb-3">Como começar:</h4>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Registre seu primeiro consumo de água na tela principal</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Complete sua meta diária para ver o progresso</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Volte aqui para acompanhar suas estatísticas</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Histórico</h1>
        <p className="text-muted-foreground mt-1">Acompanhe seu progresso ao longo do tempo</p>
      </div>

      {/* View Mode Tabs */}
      <div className="flex bg-muted/50 rounded-xl p-1 border border-border">
        {(['daily', 'weekly', 'monthly'] as const).map((id) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${viewMode === id
              ? 'bg-card text-primary shadow-sm font-medium border border-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
          >
            {id === 'daily' && <Calendar size={16} />}
            {id === 'weekly' && <BarChart3 size={16} />}
            {id === 'monthly' && <Activity size={16} />}
            <span className="text-sm">{getViewModeLabel(id)}</span>
          </button>
        ))}
      </div>

      {/* Weekly Summary */}
      <motion.div
        className="bg-card p-6 rounded-xl shadow-sm border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-[#1E88E5] rounded-full flex items-center justify-center">
            <Calendar size={16} className="text-white" />
          </div>
          <h3 className="font-semibold text-foreground">Resumo desta Semana</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-card/80 p-4 rounded-xl border border-border">
            <p className="text-2xl font-bold text-[#1E88E5]">{(weeklyStats.totalAmount / 1000).toFixed(1)}L</p>
            <p className="text-xs text-muted-foreground">Ingestão Total</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Média: {(weeklyStats.averageDaily / 1000).toFixed(1)}L/dia
            </p>
          </div>
          <div className="bg-card/80 p-4 rounded-xl border border-border">
            <p className="text-2xl font-bold text-[#00B894]">{weeklyStats.averagePercentage}%</p>
            <p className="text-xs text-muted-foreground">Média da Meta</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {weeklyStats.perfectDays}/{weeklyStats.totalDays} dias
            </p>
          </div>
        </div>

        {/* Mini Chart */}
        {chartData.length > 0 && (
          <div className="h-20 bg-card/60 rounded-lg p-2 border border-border/50">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={[0, 100]} />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#1E88E5"
                  strokeWidth={2}
                  dot={{ fill: '#1E88E5', strokeWidth: 0, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Chart Section */}
      {viewMode === 'weekly' && chartData.length > 0 && (
        <motion.div
          className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="font-semibold text-foreground mb-4">Gráfico Semanal</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis hide />
                <Bar dataKey="goal" fill="#4ECDC4" radius={[4, 4, 0, 0]} opacity={0.6} />
                <Bar dataKey="amount" fill="#1E88E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#1E88E5] rounded-full"></div>
              <span className="text-muted-foreground">Consumido</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4ECDC4' }}></div>
              <span className="text-muted-foreground">Meta</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Daily History */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          {history.map((entry, index) => {
            const percentage = entry.goal > 0 ? Math.round((entry.amount / entry.goal) * 100) : 0;
            const isGoalMet = percentage >= 90; // 90% é considerado meta alcançada
            const trend = index < history.length - 1 ?
              entry.amount - history[index + 1].amount : 0;

            return (
              <motion.div
                key={entry.date}
                className="bg-card p-5 rounded-2xl shadow-sm border border-border"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-foreground">{formatDate(entry.date)}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getProgressColor(percentage)}`}>
                        {percentage}%
                      </span>
                      {trend !== 0 && (
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                          {trend > 0 ? (
                            <TrendingUp size={12} className="text-green-500" />
                          ) : (
                            <TrendingDown size={12} className="text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(entry.amount / 1000).toFixed(1)}L / {(entry.goal / 1000).toFixed(1)}L
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-3 mb-3">
                  <motion.div
                    className={`h-3 rounded-full ${isGoalMet
                      ? 'bg-gradient-to-r from-green-400 to-green-500'
                      : 'bg-gradient-to-r from-[#42A5F5] to-[#1E88E5]'
                      }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressWidth(percentage)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>

                {/* Additional Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Droplets size={14} className="text-[#1E88E5]" />
                    <span>{entry.amount}ml consumido</span>
                  </div>
                  <div>
                    {isGoalMet ? (
                      <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <span>✓</span> Meta alcançada
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">
                        Faltam {entry.goal - entry.amount}ml
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Monthly View */}
      {viewMode === 'monthly' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MonthlyCalendar />
        </motion.div>
      )}

      {/* Load More - Mostrar apenas se houver mais dados para carregar */}
      {viewMode === 'daily' && history.length > 7 && (
        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button
            className="w-full py-4 text-[#1E88E5] font-medium bg-blue-50 dark:bg-blue-900/20 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-all border border-blue-100 dark:border-blue-800 hover:border-blue-200 dark:hover:border-blue-700"
            onClick={() => {
              // Em uma implementação real, você carregaria mais dados aqui
              // Por enquanto, apenas mostra uma mensagem
              toast.info('Funcionalidade de carregar mais histórico em desenvolvimento');
            }}
          >
            Carregar Mais Histórico ({history.length - 7} dias restantes)
          </button>
        </motion.div>
      )}

      {/* Informação sobre dados limitados */}
      {history.length <= 7 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {history.length === 1 ? '1 dia registrado' : `${history.length} dias registrados`}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Continue hidratando-se para ver mais dados no histórico
          </p>
        </div>
      )}
    </div>
  );
}