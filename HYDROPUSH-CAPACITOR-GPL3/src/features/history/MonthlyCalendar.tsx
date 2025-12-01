import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Droplets, Trophy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../shared/components/ui/button';
import { storageService } from '../../core/services/StorageService';
import type { HydrationDay } from '../../core/services/StorageService';

interface CalendarDay {
  date: string;
  amount: number;
  goal: number;
  achievement?: 'goal_met' | 'streak' | 'perfect_week' | 'new_record';
}

export function MonthlyCalendar() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [history, setHistory] = useState<HydrationDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar histórico do storageService
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const loadedHistory = storageService.loadHydrationHistory();
        setHistory(loadedHistory);

      } catch (err) {
        console.error('Erro ao carregar histórico:', err);
        setError('Erro ao carregar dados do calendário.');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  // Converter history em formato de calendário
  const getCalendarData = (): CalendarDay[] => {
    // Construir string YYYY-MM para o mês selecionado usando valores locais
    const monthStr = `${selectedMonth.getFullYear()}-${(selectedMonth.getMonth() + 1).toString().padStart(2, '0')}`;
    const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
    const calendarData: CalendarDay[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthStr}-${day.toString().padStart(2, '0')}`;
      const historyEntry = history.find(h => h.date === dateStr);

      if (historyEntry) {
        const calendarDay: CalendarDay = {
          date: dateStr,
          amount: historyEntry.amount,
          goal: historyEntry.goal
        };

        // Determinar conquistas baseado nos dados
        const percentage = (historyEntry.amount / historyEntry.goal) * 100;
        if (percentage >= 100) {
          calendarDay.achievement = 'goal_met';

          // Verificar conquistas especiais
          if (percentage >= 150) {
            calendarDay.achievement = 'new_record';
          } else if (historyEntry.amount === historyEntry.goal) {
            calendarDay.achievement = 'perfect_week';
          }
        }

        calendarData.push(calendarDay);
      }
    }

    return calendarData;
  };

  const calendarData = getCalendarData();
  const currentDate = new Date();
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedMonth(newDate);
  };

  const getDayData = (day: number): CalendarDay | null => {
    const monthStr = `${selectedMonth.getFullYear()}-${(selectedMonth.getMonth() + 1).toString().padStart(2, '0')}`;
    const dateStr = `${monthStr}-${day.toString().padStart(2, '0')}`;
    return calendarData.find(d => d.date === dateStr) || null;
  };

  const getAchievementIcon = (achievement?: string) => {
    switch (achievement) {
      case 'goal_met':
        return <Droplets size={12} className="text-blue-600" />;
      case 'perfect_week':
        return <Droplets size={12} className="text-green-600" />;
      case 'new_record':
        return <Trophy size={12} className="text-yellow-600" />;
      case 'streak':
        return <Trophy size={12} className="text-purple-600" />;
      default:
        return null;
    }
  };

  const getDayStyles = (dayData: CalendarDay | null, day: number) => {
    const today = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const isToday =
      selectedMonth.getMonth() === currentMonth &&
      selectedMonth.getFullYear() === currentYear &&
      day === today;

    const isInFuture =
      selectedMonth.getMonth() > currentMonth ||
      selectedMonth.getFullYear() > currentYear ||
      (selectedMonth.getMonth() === currentMonth &&
        selectedMonth.getFullYear() === currentYear &&
        day > today);

    // Tornar todos os dias clicáveis
    if (isToday) {
      return "bg-blue-500 text-white font-bold cursor-pointer hover:bg-blue-600";
    }

    if (dayData?.achievement) {
      return "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800";
    }

    if (isInFuture) {
      return "text-muted-foreground/50 cursor-pointer hover:bg-muted/30"; // Dias futuros clicáveis
    }

    return "cursor-pointer hover:bg-muted/50 text-muted-foreground";
  };

  const formatPercentage = (amount: number, goal: number) => {
    return Math.round((amount / goal) * 100);
  };

  // Gerar os dias do calendário
  const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const calendarDays: (number | null)[] = [];

  // Adicionar dias vazios no início
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Adicionar os dias do mês
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 rounded-xl">
          <div className="w-6 h-6 bg-muted rounded animate-pulse" />
          <div className="w-32 h-6 bg-muted rounded animate-pulse" />
          <div className="w-6 h-6 bg-muted rounded animate-pulse" />
        </div>
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 42 }).map((_, index) => (
              <div key={index} className="aspect-square bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-center">
          <p className="text-destructive text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header do Calendário */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 rounded-xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('prev')}
        >
          <ChevronLeft size={20} />
        </Button>

        <h3 className="text-lg font-semibold text-foreground">
          {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
        </h3>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('next')}
          disabled={selectedMonth >= currentDate}
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-4 text-xs bg-card p-3 rounded-lg">
        <div className="flex items-center gap-1">
          <Droplets size={10} className="text-blue-600" />
          <span>Meta</span>
        </div>
        <div className="flex items-center gap-1">
          <Droplets size={10} className="text-green-600" />
          <span>Perfeito</span>
        </div>
        <div className="flex items-center gap-1">
          <Trophy size={10} className="text-yellow-600" />
          <span>Recorde</span>
        </div>
      </div>

      {/* Calendário */}
      <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Dias do calendário */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayData = getDayData(day);
            const styles = getDayStyles(dayData, day);

            return (
              <motion.div
                key={`day-${day}`}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative ${styles}`}
                onClick={() => {
                  // Criar dados padrão se não existir
                  const monthStr = `${selectedMonth.getFullYear()}-${(selectedMonth.getMonth() + 1).toString().padStart(2, '0')}`;
                  const dateString = `${monthStr}-${day.toString().padStart(2, '0')}`;
                  const dayToShow = dayData || {
                    date: dateString,
                    amount: 0,
                    goal: 2000
                  };
                  setSelectedDay(dayToShow);
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
              >
                <span>{day}</span>
                {dayData?.achievement && (
                  <div className="absolute top-1 right-1">
                    {getAchievementIcon(dayData.achievement)}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modal de detalhes do dia */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border shadow-2xl"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {(() => {
                    // Parse YYYY-MM-DD como data local para evitar deslocamento UTC
                    const [y, m, d] = selectedDay.date.split('-').map(Number);
                    const localDate = new Date(y, m - 1, d);
                    return localDate.toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      weekday: 'long'
                    });
                  })()}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDay(null)}
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Progresso do dia */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Consumo</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatPercentage(selectedDay.amount, selectedDay.goal)}%
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {selectedDay.amount}ml de {selectedDay.goal}ml
                  </div>
                  <div className="w-full bg-white/60 dark:bg-gray-700/60 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(formatPercentage(selectedDay.amount, selectedDay.goal), 100)}%` }}
                    />
                  </div>
                </div>

                {/* Conquistas */}
                {selectedDay.achievement && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2 mb-2">
                      {getAchievementIcon(selectedDay.achievement)}
                      <span className="text-sm font-medium text-foreground">
                        Conquista desbloqueada!
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedDay.achievement === 'goal_met' && 'Meta diária alcançada'}
                      {selectedDay.achievement === 'perfect_week' && 'Hidratação perfeita'}
                      {selectedDay.achievement === 'new_record' && 'Novo recorde pessoal'}
                      {selectedDay.achievement === 'streak' && 'Sequência mantida'}
                    </p>
                  </div>
                )}

                {/* Estatísticas adicionais */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-foreground">
                      {(selectedDay.amount / 1000).toFixed(1)}L
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-foreground">
                      {selectedDay.goal - selectedDay.amount > 0 ?
                        `${selectedDay.goal - selectedDay.amount}ml` :
                        '+' + `${selectedDay.amount - selectedDay.goal}ml`
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedDay.goal - selectedDay.amount > 0 ? 'Faltou' : 'Extra'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => setSelectedDay(null)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}