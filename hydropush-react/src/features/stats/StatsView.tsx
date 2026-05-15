import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Droplets, Target, Award, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import type { UserStats } from '../../core/services/StorageService';

interface HydrationData {
  currentAmount: number;
  dailyGoal: number;
  userName: string;
}

interface HistoryEntry {
  date: string;
  amount: number;
  goal: number;
}

export interface StatsViewProps {
  data: HydrationData;
  history: HistoryEntry[];
  userStats?: UserStats;
}

export function StatsView({ data, history, userStats }: StatsViewProps) {
  // Usar dados do userStats quando disponível, caso contrário calcular localmente
  const averageIntake = userStats?.totalWaterConsumed && userStats.totalDaysTracked > 0
    ? Math.round(userStats.totalWaterConsumed / userStats.totalDaysTracked)
    : Math.round(history.reduce((sum, entry) => sum + entry.amount, 0) / Math.max(history.length, 1));

  const streakDays = userStats?.currentStreak || history.filter(entry => entry.amount >= entry.goal * 0.9).length;
  const totalWater = userStats?.totalWaterConsumed || history.reduce((sum, entry) => sum + entry.amount, 0);
  const todayProgress = Math.round((data.currentAmount / data.dailyGoal) * 100);
  const bestStreak = userStats?.bestStreak || 0;
  const perfectDays = userStats?.perfectDays || history.filter(entry => entry.amount === entry.goal).length;
  const totalGoalsAchieved = userStats?.totalGoalsAchieved || history.filter(entry => entry.amount >= entry.goal).length;
  const averageCompletion = userStats?.averageCompletion || Math.round(history.reduce((sum, entry) => sum + Math.min((entry.amount / entry.goal) * 100, 100), 0) / Math.max(history.length, 1));

  // Dados para gráficos (últimos 7 dias)
  const weeklyData = history.slice(0, 7).reverse().map((entry, index) => ({
    day: new Date(entry.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
    date: entry.date,
    amount: entry.amount,
    goal: entry.goal,
    percentage: Math.min(Math.round((entry.amount / entry.goal) * 100), 100),
    // Adicionar dados para tendência
    trend: history.slice(0, 7 + index).reduce((sum, e) => sum + e.amount, 0) / Math.max(history.slice(0, 7 + index).length, 1)
  }));

  const getInsight = () => {
    if (todayProgress >= 100) return {
      text: "🎉 Excelente! Meta alcançada hoje!",
      color: "text-green-600",
      bg: "bg-green-50",
      icon: "🏆"
    };
    if (todayProgress >= 80) return {
      text: "💪 Quase lá! Falta pouco para a meta.",
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: "⚡"
    };
    if (todayProgress >= 50) return {
      text: "👍 No meio do caminho. Continue assim!",
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      icon: "📈"
    };
    return {
      text: "💧 Vamos acelerar a hidratação!",
      color: "text-orange-600",
      bg: "bg-orange-50",
      icon: "🚀"
    };
  };

  const insight = getInsight();

  // Calcular progresso mensal (últimos 30 dias)
  const monthlyData = history.slice(0, 30);
  const monthlyCompletion = monthlyData.length > 0
    ? Math.round(monthlyData.reduce((sum, day) => sum + Math.min((day.amount / day.goal) * 100, 100), 0) / monthlyData.length)
    : 0;

  return (
    <div className="px-6 py-6 pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Estatísticas</h1>
        <p className="text-muted-foreground mt-1">Acompanhe seu progresso detalhado</p>
      </div>

      {/* Insight Card */}
      <motion.div
        className={`${insight.bg} dark:bg-opacity-20 border ${insight.bg.includes('green') ? 'border-green-200' : insight.bg.includes('blue') ? 'border-blue-200' : insight.bg.includes('yellow') ? 'border-yellow-200' : 'border-orange-200'} p-4 rounded-2xl mb-6`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white dark:bg-card rounded-full flex items-center justify-center text-xl">
            {insight.icon}
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${insight.color}`}>{insight.text}</p>
            <p className="text-sm text-muted-foreground">
              Progresso hoje: {todayProgress}% • Média geral: {averageCompletion}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          className="bg-card p-5 rounded-xl shadow-sm border border-border"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Média Diária</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{(averageIntake / 1000).toFixed(1)}L</p>
          <p className="text-xs text-muted-foreground mt-1">{averageIntake}ml por dia</p>
        </motion.div>

        <motion.div
          className="bg-card p-5 rounded-xl shadow-sm border border-border"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Sequência Atual</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{streakDays}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {bestStreak > streakDays ? `Melhor: ${bestStreak} dias` : 'dias consecutivos'}
          </p>
        </motion.div>

        <motion.div
          className="bg-card p-5 rounded-xl shadow-sm border border-border"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Target size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Metas Batidas</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalGoalsAchieved}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {perfectDays > 0 ? `${perfectDays} dias perfeitos` : `${history.length} dias registrados`}
          </p>
        </motion.div>

        <motion.div
          className="bg-card p-5 rounded-xl shadow-sm border border-border"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
              <Droplets size={16} className="text-cyan-600 dark:text-cyan-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Total Geral</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{Math.round(totalWater / 1000)}L</p>
          <p className="text-xs text-muted-foreground mt-1">
            {userStats?.totalDaysTracked || history.length} dias de hidratação
          </p>
        </motion.div>
      </div>

      {/* Gráfico de Progresso Semanal */}
      <motion.div
        className="bg-card p-6 rounded-xl shadow-sm border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Desempenho Semanal</h3>
            <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[#1E88E5] rounded-full"></div>
              <span className="text-muted-foreground">Consumido</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[#14B8A6] rounded-full"></div>
              <span className="text-muted-foreground">Meta</span>
            </div>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <YAxis hide />
              <Bar
                dataKey="goal"
                fill="#14B8A6"
                radius={[4, 4, 0, 0]}
                opacity={0.3}
              />
              <Bar
                dataKey="amount"
                fill="#1E88E5"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-center">
          <p className="text-sm text-muted-foreground">
            Progresso semanal: <span className="font-semibold text-[#1E88E5]">
              {Math.round(weeklyData.reduce((sum, day) => sum + (day.amount >= day.goal ? 100 : (day.amount / day.goal) * 100), 0) / weeklyData.length)}%
            </span>
          </p>
        </div>
      </motion.div>

      {/* Tendência de Hidratação */}
      <motion.div
        className="bg-card p-6 rounded-2xl shadow-sm border mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Tendência de Conclusão</h3>
            <p className="text-sm text-muted-foreground">Percentual das metas diárias</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#1E88E5]">{averageCompletion}%</p>
            <p className="text-xs text-muted-foreground">Média geral</p>
          </div>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <YAxis hide domain={[0, 100]} />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#1E88E5"
                strokeWidth={3}
                dot={{ fill: '#1E88E5', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#1E88E5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Visão Geral Mensal */}
      {monthlyData.length > 0 && (
        <motion.div
          className="bg-card p-6 rounded-2xl shadow-sm border mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Visão Mensal</h3>
              <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#2ECC71]">{monthlyCompletion}%</p>
              <p className="text-xs text-muted-foreground">Média mensal</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Dias registrados</span>
              <span className="font-semibold">{monthlyData.length}/30</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Metas alcançadas</span>
              <span className="font-semibold text-[#2ECC71]">
                {monthlyData.filter(day => day.amount >= day.goal).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Consumo médio</span>
              <span className="font-semibold">
                {(monthlyData.reduce((sum, day) => sum + day.amount, 0) / monthlyData.length / 1000).toFixed(1)}L
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Dicas Personalizadas */}
      <motion.div
        className="p-5 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-xl border border-primary/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Award size={18} className="text-primary" />
          </div>
          Dicas Personalizadas
        </h3>
        <div className="space-y-3">
          {todayProgress < 50 ? (
            <>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm">🚰</span>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Comece forte</p>
                  <p className="text-muted-foreground text-sm">Tome um copo grande de água ao acordar para acelerar seu metabolismo.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm">⏰</span>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Lembretes</p>
                  <p className="text-muted-foreground text-sm">Configure alertas regulares nas configurações para manter a consistência.</p>
                </div>
              </div>
            </>
          ) : todayProgress < 80 ? (
            <>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm">📈</span>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Bom progresso!</p>
                  <p className="text-muted-foreground text-sm">Você está no caminho certo. Continue com esse ritmo.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm">💡</span>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Dica</p>
                  <p className="text-muted-foreground text-sm">Adicione frutas à água para tornar a hidratação mais saborosa.</p>
                </div>
              </div>
            </>
          ) : todayProgress < 100 ? (
            <>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm">⚡</span>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Quase lá!</p>
                  <p className="text-muted-foreground text-sm">Falta pouco para bater sua meta diária.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm">🎯</span>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Estratégia</p>
                  <p className="text-muted-foreground text-sm">Divida o restante em pequenos copos ao longo do dia.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm">🎉</span>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Parabéns!</p>
                  <p className="text-muted-foreground text-sm">Você atingiu 100% da sua meta hoje!</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm">🌟</span>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Desafio</p>
                  <p className="text-muted-foreground text-sm">Tente manter essa sequência por mais {7 - (streakDays % 7)} dias para completar uma semana perfeita!</p>
                </div>
              </div>
            </>
          )}

          {streakDays >= 3 && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300 font-medium text-sm flex items-center gap-2">
                <span>⭐</span>
                Sequência impressionante! {streakDays} dias consecutivos alcançando suas metas.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}