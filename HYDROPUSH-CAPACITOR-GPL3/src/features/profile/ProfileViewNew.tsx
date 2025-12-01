import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { User, Target, Weight, Edit3, Trophy, Lightbulb, Info, Crown, Star, Calendar, Clock, Ruler } from 'lucide-react';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../shared/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../../shared/components/ui/carousel';
import { motion } from 'motion/react';
import { TipsView } from '../dashboard/TipsView';
import { useAuth } from '../../contexts/AuthContext';
import { DESIGN_TOKENS, calculateRecommendedIntake, isGoalWithinRecommendation } from '../../constants/designTokens';
import { storageService, type HydrationDay } from '../../core/services/StorageService';

interface Trofeu {
  name: string;
  icon: string;
  unlocked: boolean;
  level: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
  rarity: string;
  xp: number;
}

export function ProfileViewNew() {
  const { user, updateUser } = useAuth();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [selectedTrophy, setSelectedTrophy] = useState<Trofeu | null>(null);

  // Estados para dados do storage
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [userStats, setUserStats] = useState({
    totalDaysTracked: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalWaterConsumed: 0,
    perfectDays: 0,
    monthlyGoalsAchieved: 0,
    totalGoalsAchieved: 0,
    averageCompletion: 0
  });

  const [userInfo, setUserInfo] = useState({
    name: 'Usuário',
    weight: 0,
    height: 0,
    wakeTime: '07:00',
    sleepTime: '23:00',
    photo: ''
  });

  // Estados para upload de imagem
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  const loadUserData = useCallback(() => {
    // Carregar meta diária
    const savedGoal = storageService.loadDailyGoal();
    setDailyGoal(savedGoal);
    setNewGoal((savedGoal / 1000).toFixed(1));

    // Carregar dados do usuário do contexto
    if (user) {
      setUserInfo({
        name: user.name || 'Usuário',
        weight: user.weightKg || 0,
        height: user.heightCm ? user.heightCm / 100 : 0,
        wakeTime: user.wakeTime || '07:00',
        sleepTime: user.sleepTime || '23:00',
        photo: storageService.loadUserPhoto() || ''
      });
    }

    // Carregar estatísticas do histórico
    const history = storageService.loadHydrationHistory();
    calculateStatsFromHistory(history);
  }, [user]);

  // Carregar dados do storageService ao montar o componente
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const calculateStatsFromHistory = (history: HydrationDay[]) => {
    const stats = storageService.calculateUserStats(history);
    setUserStats(stats);
  };

  // Atualizar a quantidade atual do dia
  useEffect(() => {
    const updateCurrentAmount = () => {
      const today = new Date().toLocaleDateString('en-CA');
      const todayAmount = storageService.getDailyTotal(today);
      setCurrentAmount(todayAmount);
    };

    updateCurrentAmount();
    // Atualizar a cada minuto para refletir mudanças
    const interval = setInterval(updateCurrentAmount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Função para traduzir raridades para português brasileiro
  const translateRarity = (rarity: string): string => {
    switch (rarity) {
      case 'Common':
        return 'Comum';
      case 'Rare':
        return 'Raro';
      case 'Epic':
        return 'Épico';
      case 'Legendary':
        return 'Lendário';
      default:
        return rarity;
    }
  };

  const handleSaveGoal = () => {
    const goalValue = parseFloat(newGoal) * 1000;
    if (goalValue > 0 && goalValue <= 10000) {
      storageService.saveDailyGoal(goalValue);
      setDailyGoal(goalValue);
      setIsEditingGoal(false);

      // Atualizar histórico do dia atual se existir
      const today = new Date().toLocaleDateString('en-CA');
      const history = storageService.loadHydrationHistory();
      const todayIndex = history.findIndex(day => day.date === today);

      if (todayIndex >= 0) {
        history[todayIndex].goal = goalValue;
        storageService.saveHydrationHistory(history);
      }

      // Feedback visual com toast
      toast.success('Meta atualizada!', {
        description: `Nova meta diária: ${(goalValue / 1000).toFixed(1)}L`,
        duration: 3000,
      });
    }
  };

  const calculateRecommendedIntakeBasic = () => {
    if (!userInfo.weight || userInfo.weight === 0) return 2000;
    const { recommended } = calculateRecommendedIntake(userInfo.weight);
    return Math.round(recommended);
  };

  const todayProgress = Math.round((currentAmount / dailyGoal) * 100);
  const recommendedIntake = calculateRecommendedIntakeBasic();
  const goalStatus = userInfo.weight > 0 ? isGoalWithinRecommendation(dailyGoal, userInfo.weight) : 'ok';

  // Sistema de XP/Nível
  const calculateUserLevel = () => {
    const dailyXP = userStats.totalGoalsAchieved * 15;
    const weeklyBonus = Math.floor(userStats.bestStreak / 7) * 100;
    const twoWeekBonus = Math.floor(userStats.bestStreak / 14) * 100;
    const monthlyBonus = Math.floor(userStats.bestStreak / 30) * 250;

    const specialBonuses = [
      userStats.perfectDays >= 7 ? 100 : 0,
      userStats.totalDaysTracked >= 50 ? 150 : 0,
      userStats.totalDaysTracked >= 100 ? 300 : 0,
      userStats.averageCompletion >= 90 && userStats.totalDaysTracked >= 30 ? 250 : 0
    ];

    const totalBonusXP = specialBonuses.reduce((sum, xp) => sum + xp, 0);
    const totalXP = dailyXP + weeklyBonus + twoWeekBonus + monthlyBonus + totalBonusXP;
    const level = Math.floor(totalXP / 500) + 1;
    return Math.min(level, 20);
  };

  const calculateTotalXP = () => {
    const dailyXP = userStats.totalGoalsAchieved * 15;
    const weeklyBonus = Math.floor(userStats.bestStreak / 7) * 100;
    const twoWeekBonus = Math.floor(userStats.bestStreak / 14) * 100;
    const monthlyBonus = Math.floor(userStats.bestStreak / 30) * 250;

    const specialBonuses = [
      userStats.perfectDays >= 7 ? 100 : 0,
      userStats.totalDaysTracked >= 50 ? 150 : 0,
      userStats.totalDaysTracked >= 100 ? 300 : 0,
      userStats.averageCompletion >= 90 && userStats.totalDaysTracked >= 30 ? 250 : 0
    ];

    const totalBonusXP = specialBonuses.reduce((sum, xp) => sum + xp, 0);
    return dailyXP + weeklyBonus + twoWeekBonus + monthlyBonus + totalBonusXP;
  };

  const userLevel = calculateUserLevel();
  const totalXP = calculateTotalXP();

  const handleSaveProfile = () => {
    const updates = {
      name: userInfo.name,
      weightKg: userInfo.weight,
      heightCm: Math.round(userInfo.height * 100),
      wakeTime: userInfo.wakeTime,
      sleepTime: userInfo.sleepTime
    };

    updateUser(updates);
    setIsEditingProfile(false);
  };

  // Novo fluxo de upload: redimensionar e salvar direto
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validação: tipo e tamanho
      const maxBytes = 5 * 1024 * 1024; // 5MB
      if (!file.type.startsWith('image/')) {
        toast.error('Selecione um arquivo de imagem válido.');
        event.target.value = '';
        return;
      }
      if (file.size > maxBytes) {
        toast.error('Imagem muito grande. Limite: 5 MB.');
        event.target.value = '';
        return;
      }

      const loadingId = toast.loading('Processando imagem...');
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;

        // Redimensionar imagem para otimizar storage
        const img = new Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
          let width = img.width;
          let height = img.height;

          // Manter proporção
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Comprimir JPEG 0.8
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            setUserInfo(prev => ({ ...prev, photo: dataUrl }));
            storageService.saveUserPhoto(dataUrl);
            toast.success('Foto atualizada com sucesso!', { id: loadingId });
          } else {
            toast.error('Erro ao processar imagem.', { id: loadingId });
          }
        };

        img.onerror = () => {
          toast.error('Erro ao carregar imagem.', { id: loadingId });
        };
      };

      reader.readAsDataURL(file);
      // limpar o input para permitir re-upload do mesmo arquivo se necessário
      event.target.value = '';
    }
  };

  // Definir troféus por categoria
  const trophies = [
    { name: 'Bronze', icon: '🥉', unlocked: userLevel >= 2, level: 2 },
    { name: 'Prata', icon: '🥈', unlocked: userLevel >= 6, level: 6 },
    { name: 'Ouro', icon: '🥇', unlocked: userLevel >= 11, level: 11 },
    { name: 'Esmeralda', icon: '💎', unlocked: userLevel >= 16, level: 16 },
    { name: 'Diamante', icon: '💠', unlocked: userLevel >= 20, level: 20 }
  ];

  const achievements: Achievement[] = [
    {
      id: 'primeira_gota',
      title: 'Primeira Gota',
      description: 'Complete sua primeira meta diária',
      icon: '💧',
      unlocked: userStats.totalGoalsAchieved >= 1,
      progress: Math.min(userStats.totalGoalsAchieved, 1),
      target: 1,
      rarity: 'Common',
      xp: 50
    },
    {
      id: 'sequencia_bronze',
      title: 'Sequência Bronze',
      description: 'Complete 3 dias seguidos',
      icon: '🔥',
      unlocked: userStats.currentStreak >= 3,
      progress: Math.min(userStats.currentStreak, 3),
      target: 3,
      rarity: 'Common',
      xp: 75
    },
    {
      id: 'guerreiro_agua',
      title: 'Guerreiro da Água',
      description: 'Complete 5 metas diárias',
      icon: '⚔️',
      unlocked: userStats.totalGoalsAchieved >= 5,
      progress: Math.min(userStats.totalGoalsAchieved, 5),
      target: 5,
      rarity: 'Rare',
      xp: 100
    },
    {
      id: 'semana_perfeita',
      title: 'Semana Perfeita',
      description: '7 dias perfeitos de hidratação',
      icon: '⭐',
      unlocked: userStats.perfectDays >= 7,
      progress: Math.min(userStats.perfectDays, 7),
      target: 7,
      rarity: 'Epic',
      xp: 200
    },
    {
      id: 'sequencia_prata',
      title: 'Sequência Prata',
      description: 'Complete 7 dias seguidos',
      icon: '🔥',
      unlocked: userStats.bestStreak >= 7,
      progress: Math.min(userStats.bestStreak, 7),
      target: 7,
      rarity: 'Rare',
      xp: 150
    },
    {
      id: 'dez_metas',
      title: 'Campeão Iniciante',
      description: 'Complete 10 metas diárias',
      icon: '🏆',
      unlocked: userStats.totalGoalsAchieved >= 10,
      progress: Math.min(userStats.totalGoalsAchieved, 10),
      target: 10,
      rarity: 'Rare',
      xp: 180
    },
    {
      id: 'sequencia_ouro',
      title: 'Sequência Ouro',
      description: 'Complete 14 dias seguidos',
      icon: '🔥',
      unlocked: userStats.bestStreak >= 14,
      progress: Math.min(userStats.bestStreak, 14),
      target: 14,
      rarity: 'Epic',
      xp: 250
    },
    {
      id: 'vinte_cinco_metas',
      title: 'Mestre da Constância',
      description: 'Complete 25 metas diárias',
      icon: '🎯',
      unlocked: userStats.totalGoalsAchieved >= 25,
      progress: Math.min(userStats.totalGoalsAchieved, 25),
      target: 25,
      rarity: 'Epic',
      xp: 300
    },
    {
      id: 'mes_impecavel',
      title: 'Mês Impecável',
      description: 'Complete 30 dias seguidos',
      icon: '📅',
      unlocked: userStats.bestStreak >= 30,
      progress: Math.min(userStats.bestStreak, 30),
      target: 30,
      rarity: 'Epic',
      xp: 500
    },
    {
      id: 'veterano',
      title: 'Veterano da Hidratação',
      description: '50 dias de tracking completo',
      icon: '🎖️',
      unlocked: userStats.totalDaysTracked >= 50,
      progress: Math.min(userStats.totalDaysTracked, 50),
      target: 50,
      rarity: 'Epic',
      xp: 400
    },
    {
      id: 'cinquenta_metas',
      title: 'Especialista Hidratado',
      description: 'Complete 50 metas diárias',
      icon: '💪',
      unlocked: userStats.totalGoalsAchieved >= 50,
      progress: Math.min(userStats.totalGoalsAchieved, 50),
      target: 50,
      rarity: 'Epic',
      xp: 600
    },
    {
      id: 'sequencia_diamante',
      title: 'Sequência Diamante',
      description: 'Complete 60 dias seguidos',
      icon: '💎',
      unlocked: userStats.bestStreak >= 60,
      progress: Math.min(userStats.bestStreak, 60),
      target: 60,
      rarity: 'Legendary',
      xp: 800
    },
    {
      id: 'cem_dias',
      title: 'Centurião da Água',
      description: '100 dias de tracking completo',
      icon: '🛡️',
      unlocked: userStats.totalDaysTracked >= 100,
      progress: Math.min(userStats.totalDaysTracked, 100),
      target: 100,
      rarity: 'Legendary',
      xp: 1000
    },
    {
      id: 'cem_metas',
      title: 'Lenda da Hidratação',
      description: 'Complete 100 metas diárias',
      icon: '👑',
      unlocked: userStats.totalGoalsAchieved >= 100,
      progress: Math.min(userStats.totalGoalsAchieved, 100),
      target: 100,
      rarity: 'Legendary',
      xp: 1200
    },
    {
      id: 'noventa_perfecao',
      title: 'Mestre da Perfeição',
      description: 'Média de 90% de conclusão em 30 dias',
      icon: '✨',
      unlocked: userStats.averageCompletion >= 90 && userStats.totalDaysTracked >= 30,
      progress: Math.min(userStats.averageCompletion, 90),
      target: 90,
      rarity: 'Epic',
      xp: 400
    }
  ];

  return (
    <div className="px-6 py-6 pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações e metas</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-1 text-xs">
            <User size={14} />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-1 text-xs">
            <Trophy size={14} />
            Conquistas
          </TabsTrigger>
          <TabsTrigger value="tips" className="flex items-center gap-1 text-xs">
            <Lightbulb size={14} />
            Dicas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Informações do Perfil */}
          <motion.div
            className="bg-card p-6 rounded-xl shadow-sm border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Informações Pessoais</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-primary hover:text-primary/80 hover:bg-primary/5"
              >
                <Edit3 size={16} />
              </Button>
            </div>

            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden border-2 border-primary/20 shadow-sm">
                  {userInfo.photo ? (
                    <img src={userInfo.photo} alt="Foto do perfil" className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} className="text-primary" />
                  )}
                </div>
                {isEditingProfile && (
                  <>
                    <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary/90 transition-all hover:scale-110 border-2 border-background">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                        aria-hidden
                      />
                      <Edit3 size={18} />
                    </label>
                    <div className="mt-3 text-center">
                      <Button
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-primary/90 text-white hover:bg-primary rounded-full shadow-sm hover:shadow-md transition-all"
                      >
                        Alterar Foto
                      </Button>
                    </div>
                  </>
                )}
              </div>
              <h4 className="font-semibold text-foreground">{userInfo.name}</h4>
              <p className="text-sm text-muted-foreground">Progresso hoje: {todayProgress}%</p>
            </div>

          </motion.div>

          <div className="space-y-6">
            {/* Nome - Full width */}
            <motion.div
              className="bg-card p-5 rounded-xl border border-border shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <label className="font-medium text-foreground">Nome Completo</label>
              </div>
              {isEditingProfile ? (
                <Input
                  value={userInfo.name}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="border-border focus:border-primary"
                  placeholder="Digite seu nome completo"
                />
              ) : (
                <p className="text-foreground font-medium">{userInfo.name}</p>
              )}
            </motion.div>

            {/* Physical Info - Grid 2 columns */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                className="bg-card p-5 rounded-xl border border-border shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Weight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <label className="font-medium text-foreground">Peso</label>
                </div>
                {isEditingProfile ? (
                  <div>
                    <Input
                      type="number"
                      value={userInfo.weight || ''}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                      placeholder="Ex: 70"
                      className="border-border focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Máx. 300kg</p>
                  </div>
                ) : (
                  <p className="text-foreground font-medium">{userInfo.weight > 0 ? `${userInfo.weight} kg` : 'Não informado'}</p>
                )}
              </motion.div>

              <motion.div
                className="bg-card p-5 rounded-xl border border-border shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                    <Ruler className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <label className="font-medium text-foreground">Altura</label>
                </div>
                {isEditingProfile ? (
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      value={userInfo.height || ''}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                      placeholder="Ex: 1.75"
                      className="border-border focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Em metros</p>
                  </div>
                ) : (
                  <p className="text-foreground font-medium">{userInfo.height > 0 ? `${userInfo.height} m` : 'Não informado'}</p>
                )}
              </motion.div>
            </div>

            {/* Sleep Schedule - Grid 2 columns */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                className="bg-card p-5 rounded-xl border border-border shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <label className="font-medium text-foreground">Horário de Acordar</label>
                </div>
                {isEditingProfile ? (
                  <Input
                    type="time"
                    value={userInfo.wakeTime}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, wakeTime: e.target.value }))}
                    className="border-border focus:border-primary"
                  />
                ) : (
                  <p className="text-foreground font-medium">{userInfo.wakeTime}</p>
                )}
              </motion.div>

              <motion.div
                className="bg-card p-5 rounded-xl border border-border shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <label className="font-medium text-foreground">Horário de Dormir</label>
                </div>
                {isEditingProfile ? (
                  <Input
                    type="time"
                    value={userInfo.sleepTime}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, sleepTime: e.target.value }))}
                    className="border-border focus:border-primary"
                  />
                ) : (
                  <p className="text-foreground font-medium">{userInfo.sleepTime}</p>
                )}
              </motion.div>
            </div>
          </div>

          {isEditingProfile && (
            <div className="flex gap-2 mt-6">
              <Button onClick={handleSaveProfile} className="flex-1">
                Salvar Alterações
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 dark:hover:border-red-700"
              >
                Cancelar
              </Button>
            </div>
          )}

          {/* Meta de Hidratação */}
          <motion.div
            className="bg-card p-6 rounded-2xl shadow-sm border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Meta de Hidratação</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingGoal(!isEditingGoal)}
                className="text-primary hover:text-primary/80"
              >
                <Edit3 size={16} />
              </Button>
            </div>

            {/* Meta Sugerida - Acima */}
            {userInfo.weight > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">Meta Sugerida</span>
                </div>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Baseado no seu peso ({userInfo.weight}kg): <strong>{(recommendedIntake / 1000).toFixed(1)}L/dia</strong>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Fórmula: {DESIGN_TOKENS.WEIGHT.MAX_RECOMMENDED_ML_PER_KG}ml × peso corporal
                </p>
              </div>
            )}

            {/* Meta Diária */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <Target size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  {isEditingGoal ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        className="flex-1"
                        placeholder="2.0"
                      />
                      <span className="text-muted-foreground">L</span>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-foreground">Meta Diária (ml)</p>
                      <p className="text-primary font-bold">{(dailyGoal / 1000).toFixed(1)}L</p>
                    </div>
                  )}
                </div>
              </div>

              {isEditingGoal && (
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSaveGoal} size="sm" className="flex-1">
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingGoal(false)}
                    size="sm"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 dark:hover:border-red-700"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>

            {/* Alerta se meta muito baixa ou alta */}
            {userInfo.weight > 0 && goalStatus !== 'ok' && (
              <div className={`mt-4 p-3 rounded-xl border ${goalStatus === 'below'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                <p className={`text-sm ${goalStatus === 'below'
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-red-800 dark:text-red-200'
                  }`}>
                  {goalStatus === 'below'
                    ? DESIGN_TOKENS.STRINGS.GOAL_ALERT_BELOW
                    : DESIGN_TOKENS.STRINGS.GOAL_ALERT_EXTREME
                  }
                  {goalStatus === 'below' && (
                    <button
                      onClick={() => {
                        storageService.saveDailyGoal(recommendedIntake);
                        setDailyGoal(recommendedIntake);
                        setNewGoal((recommendedIntake / 1000).toFixed(1));
                      }}
                      className="ml-1 font-medium underline hover:no-underline"
                    >
                      {DESIGN_TOKENS.STRINGS.GOAL_ADJUST_CTA} {(recommendedIntake / 1000).toFixed(1)}L?
                    </button>
                  )}
                </p>
              </div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {/* Card Principal de Nível */}
          <motion.div
            className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl text-white relative overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute top-4 right-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="relative z-10">
              <div className="mb-4">
                <h3 className="text-2xl font-bold mb-1">
                  Nível {userLevel}
                </h3>
                <p className="text-white/90 text-sm">
                  {userLevel <= 5 ? 'Iniciante Hidratado' :
                    userLevel <= 10 ? 'Guerreiro da Água' :
                      userLevel <= 15 ? 'Mestre da Hidratação' :
                        'Lenda Diamante'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-white/20 px-2 py-1 rounded-lg text-xs font-medium">
                    {userLevel <= 5 ? 'BRONZE' :
                      userLevel <= 10 ? 'PRATA' :
                        userLevel <= 15 ? 'OURO' :
                          userLevel <= 20 ? 'ESMERALDA' : 'DIAMANTE'}
                  </span>
                </div>
              </div>

              {/* Barra de progresso para próximo nível */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progresso para o próximo nível</span>
                  <span className="font-bold">{totalXP % 500} / 500 XP</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-2 rounded-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${((totalXP % 500) / 500) * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              className="bg-card p-4 rounded-2xl text-center border border-border shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{achievements.filter(a => a.unlocked).length}</p>
              <p className="text-xs text-muted-foreground">Conquistas</p>
            </motion.div>

            <motion.div
              className="bg-card p-4 rounded-2xl text-center border border-border shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Star className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{totalXP}</p>
              <p className="text-xs text-muted-foreground">XP Total</p>
            </motion.div>

            <motion.div
              className="bg-card p-4 rounded-2xl text-center border border-border shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Crown className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{userLevel}</p>
              <p className="text-xs text-muted-foreground">Nível</p>
            </motion.div>
          </div>

          {/* Troféus Conquistados */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-foreground">
                Troféus Conquistados ({trophies.filter(t => t.unlocked).length}/{trophies.length})
              </h3>
            </div>

            <Carousel
              opts={{
                align: "center",
                loop: true,
              }}
              className="w-full max-w-sm mx-auto"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {trophies.map((trophy, index) => {
                  const getRarityStyles = (index: number, unlocked: boolean) => {
                    if (!unlocked) {
                      return {
                        card: 'bg-gradient-to-br from-gray-100/60 via-slate-100/40 to-gray-200/30 dark:from-gray-800/40 dark:via-slate-800/30 dark:to-gray-700/20 border-gray-300/50 dark:border-gray-600/40',
                        glow: '',
                        icon: 'filter grayscale opacity-50'
                      };
                    }

                    const rarityConfigs = [
                      {
                        card: 'bg-gradient-to-br from-amber-50/90 via-yellow-50/80 to-orange-100/70 dark:from-amber-900/50 dark:via-yellow-900/40 dark:to-orange-800/30 border-amber-300/70 dark:border-amber-600/60',
                        glow: 'shadow-lg shadow-amber-500/25 dark:shadow-amber-400/15 ring-1 ring-amber-200/30 dark:ring-amber-700/30',
                        icon: 'filter drop-shadow-lg'
                      },
                      {
                        card: 'bg-gradient-to-br from-slate-50/90 via-gray-50/80 to-zinc-100/70 dark:from-slate-800/50 dark:via-gray-800/40 dark:to-zinc-700/30 border-slate-300/70 dark:border-slate-500/60',
                        glow: 'shadow-lg shadow-slate-500/25 dark:shadow-slate-400/15 ring-1 ring-slate-200/30 dark:ring-slate-600/30',
                        icon: 'filter drop-shadow-lg'
                      },
                      {
                        card: 'bg-gradient-to-br from-yellow-50/90 via-amber-50/80 to-orange-100/70 dark:from-yellow-900/50 dark:via-amber-900/40 dark:to-orange-800/30 border-yellow-400/70 dark:border-yellow-500/60',
                        glow: 'shadow-xl shadow-yellow-500/30 dark:shadow-yellow-400/20 ring-1 ring-yellow-300/40 dark:ring-yellow-600/40',
                        icon: 'filter drop-shadow-xl'
                      },
                      {
                        card: 'bg-gradient-to-br from-emerald-50/90 via-green-50/80 to-teal-100/70 dark:from-emerald-900/50 dark:via-green-900/40 dark:to-teal-800/30 border-emerald-400/70 dark:border-emerald-500/60',
                        glow: 'shadow-xl shadow-emerald-500/35 dark:shadow-emerald-400/25 ring-1 ring-emerald-300/50 dark:ring-emerald-600/50',
                        icon: 'filter drop-shadow-xl'
                      },
                      {
                        card: 'bg-gradient-to-br from-cyan-50/90 via-blue-50/80 to-indigo-100/70 dark:from-cyan-900/50 dark:via-blue-900/40 dark:to-indigo-800/30 border-cyan-400/70 dark:border-cyan-500/60',
                        glow: 'shadow-2xl shadow-cyan-500/40 dark:shadow-cyan-400/30 ring-2 ring-cyan-300/60 dark:ring-cyan-600/60',
                        icon: 'filter drop-shadow-2xl'
                      }
                    ];

                    return rarityConfigs[index] || rarityConfigs[0];
                  };

                  const rarityStyles = getRarityStyles(index, trophy.unlocked);

                  return (
                    <CarouselItem key={trophy.name} className="pl-2 md:pl-4 basis-4/5">
                      <motion.div
                        className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 cursor-pointer min-h-[140px] flex flex-col justify-center items-center relative overflow-hidden backdrop-blur-sm ${rarityStyles.card} ${rarityStyles.glow} ${trophy.unlocked
                          ? 'hover:scale-105 hover:-translate-y-1 opacity-100'
                          : 'opacity-60 hover:opacity-80 hover:scale-102'
                          }`}
                        initial={{ opacity: 0, scale: 0.6, rotateY: -90 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        transition={{
                          delay: 0.5 + index * 0.15,
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                          duration: 0.6
                        }}
                        onClick={() => setSelectedTrophy(trophy)}
                        whileHover={{
                          scale: trophy.unlocked ? 1.05 : 1.02,
                          y: trophy.unlocked ? -4 : -2,
                          rotateZ: trophy.unlocked ? [0, -1, 1, 0] : 0,
                          transition: { duration: 0.3, ease: "easeOut" }
                        }}
                        whileTap={{ scale: 0.98, y: 0 }}
                      >
                        {trophy.unlocked && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/20 to-transparent rounded-2xl"
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 4,
                              ease: "easeInOut"
                            }}
                          />
                        )}

                        {trophy.unlocked && index >= 2 && (
                          <motion.div
                            className="absolute inset-0 opacity-20"
                            style={{
                              background: index === 2 ? 'radial-gradient(circle at center, #F59E0B, transparent)' :
                                index === 3 ? 'radial-gradient(circle at center, #10B981, transparent)' :
                                  'radial-gradient(circle at center, #06B6D4, transparent)'
                            }}
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.1, 0.3, 0.1]
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        )}

                        <motion.div
                          className={`text-4xl mb-3 relative z-10 ${rarityStyles.icon}`}
                          animate={trophy.unlocked ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          } : {}}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                            ease: "easeInOut"
                          }}
                        >
                          {trophy.icon}
                        </motion.div>

                        <motion.p
                          className={`font-bold text-foreground leading-tight text-center relative z-10 text-sm ${trophy.unlocked ? 'text-shadow-sm' : ''}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + index * 0.15 }}
                        >
                          {(() => {
                            const trophyLevel = trophy.name?.toLowerCase();
                            if (trophyLevel?.includes('bronze') || index === 0) return 'Troféu Bronze';
                            if (trophyLevel?.includes('prata') || index === 1) return 'Troféu Prata';
                            if (trophyLevel?.includes('ouro') || index === 2) return 'Troféu Ouro';
                            if (trophyLevel?.includes('esmeralda') || index === 3) return 'Troféu Esmeralda';
                            if (trophyLevel?.includes('diamante') || index === 4) return 'Troféu Diamante';
                            return trophy.name;
                          })()}
                        </motion.p>

                        <motion.p
                          className="text-xs text-muted-foreground mt-1 relative z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.9 + index * 0.15 }}
                        >
                          Nível {trophy.level}
                        </motion.p>

                        <motion.div
                          className={`mt-2 px-3 py-1 rounded-full text-xs font-medium relative z-10 ${trophy.unlocked
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                            : 'bg-gray-100 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                            }`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.1 + index * 0.15, type: "spring", stiffness: 500 }}
                        >
                          {trophy.unlocked ? '✓ Desbloqueado' : '🔒 Bloqueado'}
                        </motion.div>

                        {trophy.unlocked && index >= 2 && (
                          <motion.div
                            className={`absolute -top-2 -right-2 w-4 h-4 rounded-full ${index === 2 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                              index === 3 ? 'bg-gradient-to-br from-emerald-400 to-green-500' :
                                'bg-gradient-to-br from-cyan-400 to-blue-500'
                              }`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1 + index * 0.15, type: "spring", stiffness: 500 }}
                          />
                        )}
                      </motion.div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>

            <div className="flex justify-center gap-2 mt-4">
              {trophies.map((trophy, index) => (
                <motion.div
                  key={`indicator-${index}`}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${trophy.unlocked
                    ? (() => {
                      switch (index) {
                        case 0: return 'bg-amber-500';
                        case 1: return 'bg-slate-500';
                        case 2: return 'bg-yellow-500';
                        case 3: return 'bg-emerald-500';
                        case 4: return 'bg-cyan-500';
                        default: return 'bg-gray-400';
                      }
                    })()
                    : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.3 + index * 0.1, type: "spring", stiffness: 500 }}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>
          </motion.div>

          {/* Objetivos de Progresso */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-foreground">
                Objetivos de Progresso ({achievements.filter(a => a.unlocked).length}/{achievements.length})
              </h3>
            </div>

            <div className="space-y-4">
              {achievements.map((achievement, index) => {
                const getAchievementEmoji = () => {
                  const title = achievement.title?.toLowerCase() || '';
                  const id = achievement.id?.toLowerCase() || '';

                  if (title.includes('meta') || title.includes('objetivo') || id.includes('goal')) return '🎯';
                  if (title.includes('sequência') || title.includes('constância') || id.includes('streak')) return '🔥';
                  if (title.includes('litros') || title.includes('volume') || id.includes('volume')) return '🌊';
                  if (title.includes('dias') || title.includes('semana') || id.includes('daily')) return '📅';
                  if (title.includes('perfeito') || title.includes('100%') || id.includes('perfect')) return '⭐';
                  if (title.includes('primeiro') || title.includes('início') || id.includes('first')) return '🌱';
                  if (title.includes('conquista') || title.includes('troféu') || id.includes('trophy')) return '🏆';
                  if (title.includes('nível') || title.includes('progresso') || id.includes('level')) return '📈';
                  if (title.includes('dedicação') || title.includes('compromisso') || id.includes('dedication')) return '💪';
                  return '💧';
                };

                const getRarityColors = (rarity: string, unlocked: boolean) => {
                  if (!unlocked) return 'bg-gradient-to-br from-gray-400/60 to-gray-500/60';

                  switch (rarity) {
                    case 'Common':
                      return 'bg-gradient-to-br from-gray-500 via-gray-600 to-slate-700 shadow-gray-500/25';
                    case 'Rare':
                      return 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 shadow-blue-500/30';
                    case 'Epic':
                      return 'bg-gradient-to-br from-purple-500 via-purple-600 to-violet-700 shadow-purple-500/30';
                    case 'Legendary':
                      return 'bg-gradient-to-br from-orange-500 via-red-500 to-red-600 shadow-orange-500/40';
                    default:
                      return 'bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 shadow-green-500/25';
                  }
                };

                const getCardColors = (rarity: string, unlocked: boolean) => {
                  if (!unlocked) return 'bg-gradient-to-br from-gray-50/80 via-slate-50/60 to-gray-100/40 dark:from-gray-900/30 dark:via-slate-900/20 dark:to-gray-800/10 border-gray-300/50 dark:border-gray-700/50 shadow-sm';

                  switch (rarity) {
                    case 'Common':
                      return 'bg-gradient-to-br from-gray-50/90 via-slate-50/80 to-zinc-100/70 dark:from-gray-900/40 dark:via-slate-900/30 dark:to-gray-800/20 border-gray-300/70 dark:border-gray-600/60 shadow-lg shadow-gray-200/30 dark:shadow-gray-900/20';
                    case 'Rare':
                      return 'bg-gradient-to-br from-blue-50/90 via-indigo-50/80 to-sky-100/70 dark:from-blue-900/40 dark:via-indigo-900/30 dark:to-blue-800/20 border-blue-300/70 dark:border-blue-600/60 shadow-lg shadow-blue-200/30 dark:shadow-blue-900/20';
                    case 'Epic':
                      return 'bg-gradient-to-br from-purple-50/90 via-violet-50/80 to-fuchsia-100/70 dark:from-purple-900/40 dark:via-violet-900/30 dark:to-purple-800/20 border-purple-300/70 dark:border-purple-600/60 shadow-lg shadow-purple-200/30 dark:shadow-purple-900/20';
                    case 'Legendary':
                      return 'bg-gradient-to-br from-orange-50/90 via-red-50/80 to-rose-100/70 dark:from-orange-900/40 dark:via-red-900/30 dark:to-orange-800/20 border-orange-300/70 dark:border-orange-600/60 shadow-xl shadow-orange-200/40 dark:shadow-orange-900/25';
                    default:
                      return 'bg-gradient-to-br from-green-50/90 via-emerald-50/80 to-teal-100/70 dark:from-green-900/40 dark:via-emerald-900/30 dark:to-green-800/20 border-green-300/70 dark:border-green-600/60 shadow-lg shadow-green-200/30 dark:shadow-green-900/20';
                  }
                };

                const getGlowEffect = (rarity: string, unlocked: boolean) => {
                  if (!unlocked) return '';

                  switch (rarity) {
                    case 'Legendary':
                      return 'shadow-xl shadow-orange-500/20 dark:shadow-orange-400/15 ring-1 ring-orange-200/30 dark:ring-orange-700/30';
                    case 'Epic':
                      return 'shadow-lg shadow-purple-500/15 dark:shadow-purple-400/10 ring-1 ring-purple-200/25 dark:ring-purple-700/25';
                    case 'Rare':
                      return 'shadow-lg shadow-blue-500/15 dark:shadow-blue-400/10 ring-1 ring-blue-200/25 dark:ring-blue-700/25';
                    default:
                      return 'shadow-md shadow-gray-500/10 dark:shadow-gray-400/5';
                  }
                };

                return (
                  <motion.div
                    key={achievement.id}
                    className={`p-5 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] cursor-pointer backdrop-blur-sm ${getCardColors(achievement.rarity, achievement.unlocked)} ${getGlowEffect(achievement.rarity, achievement.unlocked)}`}
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{
                      delay: 0.7 + index * 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                    whileHover={{
                      y: -2,
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl relative overflow-hidden ${getRarityColors(achievement.rarity, achievement.unlocked)}`}
                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.3 }}
                      >
                        {achievement.unlocked && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/40 to-transparent"
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                              ease: "easeInOut"
                            }}
                          />
                        )}
                        {achievement.unlocked ? (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: 0.8 + index * 0.05,
                              type: "spring",
                              stiffness: 500,
                              damping: 15
                            }}
                          >
                            {getAchievementEmoji()}
                          </motion.span>
                        ) : (
                          <span className="text-muted-foreground filter grayscale opacity-50">
                            {getAchievementEmoji()}
                          </span>
                        )}
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-foreground leading-tight pr-2">
                            {achievement.title}
                          </h5>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <motion.span
                              className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/30 px-2 py-1 rounded-lg"
                              whileHover={{ scale: 1.05 }}
                            >
                              +{achievement.xp} XP
                            </motion.span>
                            {achievement.unlocked && (
                              <motion.span
                                className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-100/80 dark:bg-green-900/30 w-6 h-6 rounded-full flex items-center justify-center"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                  delay: 0.9 + index * 0.05,
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 15
                                }}
                              >
                                ✓
                              </motion.span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {achievement.description}
                        </p>

                        {/* Barra de Progresso */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-2">
                            <span className="text-muted-foreground font-medium">Progresso</span>
                            <motion.span
                              className="font-bold text-foreground"
                              key={`${achievement.progress}-${achievement.target}`}
                              initial={{ scale: 1.2, color: "#00B894" }}
                              animate={{ scale: 1, color: "inherit" }}
                              transition={{ duration: 0.3 }}
                            >
                              {achievement.progress}/{achievement.target}
                            </motion.span>
                          </div>
                          <div className="w-full bg-muted/70 rounded-full h-3 overflow-hidden shadow-inner">
                            <motion.div
                              className={`h-3 rounded-full relative overflow-hidden ${achievement.unlocked
                                ? getRarityColors(achievement.rarity, true).replace('bg-gradient-to-br', 'bg-gradient-to-r')
                                : 'bg-gradient-to-r from-blue-500 via-blue-600 to-primary'
                                }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                              transition={{
                                duration: 1.2,
                                delay: 0.8 + index * 0.05,
                                ease: "easeOut"
                              }}
                            >
                              {achievement.unlocked && (
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                  initial={{ x: "-100%" }}
                                  animate={{ x: "100%" }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatDelay: 2,
                                    ease: "easeInOut"
                                  }}
                                />
                              )}
                            </motion.div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <motion.span
                            className={`text-xs px-3 py-1.5 rounded-full font-bold backdrop-blur-sm border ${achievement.rarity === 'Common' ? 'bg-gray-100/80 text-gray-800 dark:bg-gray-800/60 dark:text-gray-200 border-gray-300/50 dark:border-gray-600/50' :
                              achievement.rarity === 'Rare' ? 'bg-blue-100/80 text-blue-800 dark:bg-blue-800/60 dark:text-blue-200 border-blue-300/50 dark:border-blue-600/50' :
                                achievement.rarity === 'Epic' ? 'bg-purple-100/80 text-purple-800 dark:bg-purple-800/60 dark:text-purple-200 border-purple-300/50 dark:border-purple-600/50' :
                                  'bg-gradient-to-r from-orange-100/80 to-red-100/80 text-orange-800 dark:from-orange-800/60 dark:to-red-800/60 dark:text-orange-200 border-orange-300/50 dark:border-orange-600/50'
                              }`}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            {translateRarity(achievement.rarity)}
                          </motion.span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="tips">
          <TipsView />
        </TabsContent>
      </Tabs>

      {/* Modal de Preview dos Troféus */}
      <Dialog open={!!selectedTrophy
      } onOpenChange={() => setSelectedTrophy(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              Troféu {selectedTrophy?.name}
            </DialogTitle>
            <DialogDescription className="text-center">
              Detalhes sobre sua conquista de hidratação
            </DialogDescription>
          </DialogHeader>

          {selectedTrophy && (
            <motion.div
              className="text-center p-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className={`text-6xl mb-4 inline-block filter drop-shadow-lg`}
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {selectedTrophy.icon}
              </motion.div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-xl text-foreground mb-2">
                    {selectedTrophy.name}
                  </h3>

                  <div className="flex justify-center mb-3">
                    <span className={`px-4 py-2 rounded-full font-bold text-sm ${(() => {
                      const trophyLevel = selectedTrophy.name?.toLowerCase();
                      if (trophyLevel?.includes('bronze')) return 'bg-gradient-to-r from-amber-600 to-yellow-700 text-white shadow-lg shadow-amber-500/30';
                      if (trophyLevel?.includes('prata')) return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-lg shadow-gray-500/30';
                      if (trophyLevel?.includes('ouro')) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/30';
                      if (trophyLevel?.includes('esmeralda')) return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30';
                      if (trophyLevel?.includes('diamante')) return 'bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/30';
                      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
                    })()
                      }`}>
                      Nível {selectedTrophy.level}
                    </span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${selectedTrophy.unlocked
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                  }`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {selectedTrophy.unlocked ? (
                      <>
                        <Crown className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="font-semibold text-green-800 dark:text-green-200">
                          Desbloqueado!
                        </span>
                      </>
                    ) : (
                      <>
                        <Trophy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          Bloqueado
                        </span>
                      </>
                    )}
                  </div>

                  <p className={`text-sm ${selectedTrophy.unlocked
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-gray-600 dark:text-gray-400'
                    }`}>
                    {selectedTrophy.unlocked
                      ? 'Parabéns! Você conquistou este troféu pela sua dedicação na hidratação.'
                      : `Continue se hidratando para alcançar o nível ${selectedTrophy.level} e desbloquear este troféu!`
                    }
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Informações do Nível
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Nível necessário:</span>
                      <span className="font-semibold text-blue-800 dark:text-blue-200">{selectedTrophy.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Seu nível atual:</span>
                      <span className="font-semibold text-blue-800 dark:text-blue-200">{userLevel}</span>
                    </div>
                    {!selectedTrophy.unlocked && (
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-300">Faltam:</span>
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          {selectedTrophy.level - userLevel} níveis
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}