import React, { useState, useEffect, useRef } from 'react';
import { User, Target, Weight, Edit3, Settings, Trophy, Lightbulb, Info, Clock } from 'lucide-react';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../shared/components/ui/tooltip';
import { motion } from 'motion/react';
import { TipsView } from '../dashboard/TipsView';
import { useAuth } from '../../contexts/AuthContext';
import { DESIGN_TOKENS, calculateRecommendedIntake, isGoalWithinRecommendation } from '../../constants/designTokens';
import { storageService, type HydrationDay } from '../../core/services/StorageService';

// Removemos as interfaces de props e usamos dados do storageService
export function ProfileView() {
  const { user, updateUser } = useAuth();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newGoal, setNewGoal] = useState('');

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

  // Usar dados reais do usuário do contexto
  const [userInfo, setUserInfo] = useState({
    name: 'Usuário',
    weight: 0,
    height: 0,
    sex: 'Prefiro não responder',
    wakeTime: '07:00',
    sleepTime: '23:00',
    photo: ''
  });

  // Estados para crop de foto (melhoria do upload)
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [baseFitScale, setBaseFitScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ sx: 0, sy: 0, px: 0, py: 0 });
  const cropContainerSize = 220;
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Carregar dados do storageService ao montar o componente
  useEffect(() => {
    const loadUserData = () => {
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
          sex: user.sex || 'Prefiro não responder',
          wakeTime: user.wakeTime || '07:00',
          sleepTime: user.sleepTime || '23:00',
          photo: localStorage.getItem('hydropush_user_photo') || ''
        });
      }

      // Carregar estatísticas do histórico
      const history = storageService.loadHydrationHistory();
      calculateStatsFromHistory(history);
    };

    loadUserData();
  }, [user]);

  const calculateStatsFromHistory = (history: HydrationDay[]) => {
    if (history.length === 0) {
      setUserStats({
        totalDaysTracked: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalWaterConsumed: 0,
        perfectDays: 0,
        monthlyGoalsAchieved: 0,
        totalGoalsAchieved: 0,
        averageCompletion: 0
      });
      return;
    }

    const totalDaysTracked = history.length;
    const totalWaterConsumed = history.reduce((sum, day) => sum + day.amount, 0);
    const perfectDays = history.filter(day => day.amount >= day.goal).length;
    const totalGoalsAchieved = history.filter(day => day.amount >= day.goal).length;

    // Calcular sequência atual e melhor sequência
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Ordenar por data (mais recente primeiro)
    const sortedHistory = [...history].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const day of sortedHistory) {
      if (day.amount >= day.goal) {
        tempStreak++;
        currentStreak = Math.max(currentStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    bestStreak = currentStreak;

    // Calcular média de conclusão
    const averageCompletion = Math.round(
      history.reduce((sum, day) => sum + Math.min((day.amount / day.goal) * 100, 100), 0) /
      Math.max(history.length, 1)
    );

    setUserStats({
      totalDaysTracked,
      currentStreak,
      bestStreak,
      totalWaterConsumed,
      perfectDays,
      monthlyGoalsAchieved: Math.floor(totalGoalsAchieved / 30), // Aproximação mensal
      totalGoalsAchieved,
      averageCompletion
    });
  };

  const handleSaveGoal = () => {
    const goalValue = parseFloat(newGoal) * 1000; // Convertendo L para ml
    if (goalValue > 0 && goalValue <= 10000) { // Limite razoável de 10L
      storageService.saveDailyGoal(goalValue);
      setDailyGoal(goalValue);
      setIsEditingGoal(false);

      // Atualizar histórico do dia atual se existir
      const today = new Date().toLocaleDateString('en-CA');
      const history = storageService.loadHydrationHistory();
      const todayIndex = history.findIndex(day => day.date === today);

      if (todayIndex >= 0) {
        history[todayIndex].goal = goalValue;
        // File reading could be implemented here if needed
        // new FileReader();
      }
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

  // Funções de crop reutilizadas para este componente
  const handleImageLoadForCrop = (img: HTMLImageElement) => {
    imageRef.current = img;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNaturalSize({ w, h });
    const fitScale = Math.max(cropContainerSize / w, cropContainerSize / h);
    setBaseFitScale(fitScale);
    const displayedW = w * fitScale;
    const displayedH = h * fitScale;
    const initialX = (cropContainerSize - displayedW) / 2;
    const initialY = (cropContainerSize - displayedH) / 2;
    setCropPos({ x: initialX, y: initialY });
    setCropZoom(1);
  };

  const onPanStart = (clientX: number, clientY: number) => {
    setIsPanning(true);
    panStart.current = { sx: clientX, sy: clientY, px: cropPos.x, py: cropPos.y };
  };

  const onPanMove = (clientX: number, clientY: number) => {
    if (!isPanning) return;
    const dx = clientX - panStart.current.sx;
    const dy = clientY - panStart.current.sy;
    const newX = panStart.current.px + dx;
    const newY = panStart.current.py + dy;
    const finalScale = baseFitScale * cropZoom;
    const dispW = naturalSize.w * finalScale;
    const dispH = naturalSize.h * finalScale;
    const minX = Math.min(cropContainerSize - dispW, 0);
    const minY = Math.min(cropContainerSize - dispH, 0);
    const clampedX = Math.max(Math.min(newX, 0), minX);
    const clampedY = Math.max(Math.min(newY, 0), minY);
    setCropPos({ x: clampedX, y: clampedY });
  };

  const onPanEnd = () => setIsPanning(false);

  const saveCroppedImage = () => {
    if (!imageRef.current) return;
    // ❌ NÃO USAR TOASTS - feedback visual já está no botão
    const img = imageRef.current;
    const finalScale = baseFitScale * cropZoom;
    const sx = Math.max(0, (-cropPos.x) / finalScale);
    const sy = Math.max(0, (-cropPos.y) / finalScale);
    const sourceCropSize = cropContainerSize / finalScale;
    const sSize = Math.min(sourceCropSize, naturalSize.w - sx, naturalSize.h - sy);
    const outputSize = 480;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingQuality = 'high';
    try {
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setUserInfo(prev => ({ ...prev, photo: dataUrl }));
      localStorage.setItem('hydropush_user_photo', dataUrl);
      setShowCropModal(false);
      setImageToCrop(null);
      // ✅ Sucesso - usuário verá foto atualizada imediatamente
    } catch (e) {
      console.error('Erro ao gerar imagem recortada', e);
      // ❌ Erro será tratado visualmente em versão futura
    }
  };

  return (
    <div className="px-6 py-4 pb-8">
      <div className="mb-6">
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
          {/* Profile Header */}
          <motion.div
            className="bg-gradient-to-br from-[#1E88E5] to-[#42A5F5] p-6 rounded-2xl shadow-sm text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <motion.label
                className="relative w-20 h-20 rounded-full flex items-center justify-center cursor-pointer overflow-hidden group"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.08 }}
                style={{
                  background: userInfo.photo
                    ? 'transparent'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)'
                }}
              >
                {/* Photo or placeholder */}
                {userInfo.photo ? (
                  <img
                    src={userInfo.photo}
                    alt="Foto do usuário"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User size={28} className="text-white" />
                )}

                {/* Hover overlay with glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-cyan-500/40 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-xs text-white font-semibold drop-shadow-lg">Alterar</span>
                </div>

                {/* Animated ring on hover */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-white/60"
                  initial={{ scale: 1, opacity: 0 }}
                  whileHover={{ scale: 1.1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  aria-hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const result = ev.target?.result as string;
                        setImageToCrop(result);
                        setCropZoom(1);
                        setCropPos({ x: 0, y: 0 });
                        setNaturalSize({ w: 0, h: 0 });
                        setShowCropModal(true);
                      };
                      reader.readAsDataURL(file);
                    }
                    e.currentTarget.value = '';
                  }}
                />
              </motion.label>
              {isEditingProfile && (
                <div className="ml-2">
                  <Button size="sm" onClick={() => fileInputRef.current?.click()} className="text-white bg-white/10 hover:bg-white/20">Enviar Foto</Button>
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">{userInfo.name}</h2>
                <p className="text-white/80">Usuário Hydropush</p>
              </div>
              <motion.button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="ml-auto p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <Settings size={16} className="text-white" />
              </motion.button>
            </div>

            {/* Modal de recorte de imagem */}
            {showCropModal && imageToCrop && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                style={{ background: 'rgba(0, 0, 0, 0.6)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-card rounded-3xl p-6 w-full max-w-md shadow-2xl border border-border/50"
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", damping: 20 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-foreground">✂️ Editar Foto</h4>
                    <button
                      onClick={() => { setShowCropModal(false); setImageToCrop(null); }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded-lg hover:bg-muted"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="mx-auto mb-4" style={{ width: cropContainerSize }}>
                    <div
                      style={{
                        width: cropContainerSize,
                        height: cropContainerSize,
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '16px',
                        border: '2px solid var(--border)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        cursor: isPanning ? 'grabbing' : 'grab'
                      }}
                      onMouseDown={(e) => onPanStart(e.clientX, e.clientY)}
                      onMouseMove={(e) => { if (isPanning) onPanMove(e.clientX, e.clientY); }}
                      onMouseUp={() => onPanEnd()}
                      onMouseLeave={() => onPanEnd()}
                      onTouchStart={(e) => { const t = e.touches[0]; onPanStart(t.clientX, t.clientY); }}
                      onTouchMove={(e) => { const t = e.touches[0]; if (isPanning) onPanMove(t.clientX, t.clientY); }}
                      onTouchEnd={() => onPanEnd()}
                    >
                      <img
                        src={imageToCrop}
                        alt="Para recortar"
                        onLoad={(e) => handleImageLoadForCrop(e.currentTarget)}
                        draggable={false}
                        style={{
                          position: 'absolute',
                          left: cropPos.x,
                          top: cropPos.y,
                          transform: `scale(${baseFitScale * cropZoom})`,
                          transformOrigin: 'top left',
                          userSelect: 'none',
                          touchAction: 'none',
                          pointerEvents: 'none'
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">🔍 Zoom</span>
                      <input
                        type="range"
                        min={0.5}
                        max={3}
                        step={0.01}
                        value={cropZoom}
                        onChange={(e) => {
                          const newZoom = parseFloat(e.target.value);
                          const prevFinal = baseFitScale * cropZoom;
                          const newFinal = baseFitScale * newZoom;
                          const centerX = (cropContainerSize / 2 - cropPos.x) / prevFinal;
                          const centerY = (cropContainerSize / 2 - cropPos.y) / prevFinal;
                          const newPosX = cropContainerSize / 2 - centerX * newFinal;
                          const newPosY = cropContainerSize / 2 - centerY * newFinal;
                          setCropZoom(newZoom);
                          const minX = Math.min(cropContainerSize - naturalSize.w * baseFitScale * newZoom, 0);
                          const minY = Math.min(cropContainerSize - naturalSize.h * baseFitScale * newZoom, 0);
                          setCropPos({ x: Math.max(Math.min(newPosX, 0), minX), y: Math.max(Math.min(newPosY, 0), minY) });
                        }}
                        className="flex-1 accent-blue-500"
                      />
                      <span className="text-sm font-semibold text-foreground w-12 text-right">{Math.round(cropZoom * 100)}%</span>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <Button
                        onClick={saveCroppedImage}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg"
                      >
                        ✓ Salvar
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-2"
                        onClick={() => { setShowCropModal(false); setImageToCrop(null); }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-2xl font-bold">{todayProgress}%</p>
                <p className="text-sm text-white/80">Progresso Hoje</p>
              </div>
              <div className="text-center bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-2xl font-bold">{(dailyGoal / 1000).toFixed(1)}L</p>
                <p className="text-sm text-white/80">Meta Diária</p>
              </div>
            </div>
          </motion.div>

          {/* Personal Info */}
          <motion.div
            className="bg-card p-6 rounded-2xl shadow-sm border mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Informações Pessoais</h3>
              {!isEditingProfile && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(true)}>
                  <Edit3 size={16} />
                </Button>
              )}
            </div>

            {isEditingProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nome</label>
                  <Input
                    type="text"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Peso (kg)</label>
                    <Input
                      type="number"
                      min="0"
                      max={DESIGN_TOKENS.WEIGHT.MAX_HUMAN_KG}
                      value={userInfo.weight}
                      onChange={(e) => setUserInfo({ ...userInfo, weight: parseFloat(e.target.value) })}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground cursor-help">
                            <Info size={12} />
                            <span>Máx.: {DESIGN_TOKENS.WEIGHT.MAX_HUMAN_KG} kg</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">{DESIGN_TOKENS.STRINGS.WEIGHT_MAX_TOOLTIP}</p>
                          <p className="text-xs text-muted-foreground mt-1">Fonte: {DESIGN_TOKENS.STRINGS.WEIGHT_MAX_SOURCE}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Altura (m)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={userInfo.height}
                      onChange={(e) => setUserInfo({ ...userInfo, height: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Acordar</label>
                    <Input
                      type="time"
                      value={userInfo.wakeTime}
                      onChange={(e) => setUserInfo({ ...userInfo, wakeTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Dormir</label>
                    <Input
                      type="time"
                      value={userInfo.sleepTime}
                      onChange={(e) => setUserInfo({ ...userInfo, sleepTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (user) {
                        updateUser({
                          name: userInfo.name,
                          weightKg: userInfo.weight,
                          heightCm: Math.round(userInfo.height * 100),
                          wakeTime: userInfo.wakeTime,
                          sleepTime: userInfo.sleepTime
                        });
                      }
                      setIsEditingProfile(false);
                    }}
                    className="flex-1 bg-[#1E88E5] hover:bg-[#1565C0]"
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingProfile(false)}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Weight size={16} className="text-[#1E88E5]" />
                    <span className="text-muted-foreground">Peso:</span>
                  </div>
                  <span className="font-medium text-foreground">{userInfo.weight} kg</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-[#42A5F5]" />
                    <span className="text-muted-foreground">Altura:</span>
                  </div>
                  <span className="font-medium text-foreground">{userInfo.height > 0 ? `${userInfo.height.toFixed(2)} m` : 'Não informado'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-purple-500" />
                    <span className="text-muted-foreground">Horário:</span>
                  </div>
                  <span className="font-medium text-foreground">{userInfo.wakeTime} - {userInfo.sleepTime}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Daily Goal */}
          <motion.div
            className="bg-card p-6 rounded-2xl shadow-sm border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Meta Diária</h3>
              <Target size={20} className="text-[#1E88E5]" />
            </div>

            {isEditingGoal ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="flex-1"
                    placeholder="Digite a meta em litros"
                  />
                  <span className="text-muted-foreground">L</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveGoal} className="flex-1 bg-[#1E88E5] hover:bg-[#1565C0]">Salvar</Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingGoal(false)}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold text-foreground">{(dailyGoal / 1000).toFixed(1)}L</p>
                    <p className="text-sm text-muted-foreground">Meta diária atual</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingGoal(true)}
                    className="border-[#1E88E5] text-[#1E88E5] hover:bg-[#1E88E5] hover:text-white"
                  >
                    Editar
                  </Button>
                </div>
              </div>
            )}

            {/* Meta Sugerida */}
            <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Lightbulb size={14} className="text-white" />
                </div>
                <h4 className="font-semibold text-blue-800">Meta Sugerida</h4>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-900">
                    {(recommendedIntake / 1000).toFixed(1)}L
                  </p>
                  <p className="text-sm text-blue-600">Baseado no seu perfil</p>
                </div>
                {Math.abs(dailyGoal - recommendedIntake) > 100 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      storageService.saveDailyGoal(recommendedIntake);
                      setDailyGoal(recommendedIntake);
                      setNewGoal((recommendedIntake / 1000).toFixed(1));
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Aplicar
                  </Button>
                )}
              </div>
            </div>

            {/* Meta Diária (ml) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200/50">
                <p className="text-sm text-emerald-800">
                  🎯 <span className="font-medium">Meta Diária (ml):</span>
                </p>
                <p className="text-lg font-semibold text-emerald-900">
                  {dailyGoal}ml
                </p>
                <p className="text-xs text-emerald-600">Meta atual</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200/50">
                <p className="text-sm text-purple-800">
                  📊 <span className="font-medium">Progresso:</span>
                </p>
                <p className="text-lg font-semibold text-purple-900">
                  {todayProgress}%
                </p>
                <p className="text-xs text-purple-600">da meta alcançada</p>
              </div>
            </div>

            {goalStatus !== 'ok' && userInfo.weight > 0 && (
              <div className={`mt-4 p-3 border rounded-lg ${goalStatus === 'below'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
                }`}>
                <p className={`text-sm ${goalStatus === 'below'
                  ? 'text-yellow-800'
                  : 'text-red-800'
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
          {/* Card de Nível */}
          <motion.div
            className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-6 rounded-3xl border border-indigo-200/30 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-pulse" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Nível Atual
                </h3>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center"
                >
                  <Trophy className="w-4 h-4 text-white" />
                </motion.div>
              </div>

              <div className="text-center mb-6">
                <motion.div
                  className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {userLevel}
                </motion.div>
                <p className="text-muted-foreground font-medium">Nível Atual</p>
                <p className="text-sm text-muted-foreground mt-1">{totalXP} XP Total</p>
              </div>

              {/* Barra de progresso para próximo nível */}
              <div className="relative mb-4">
                <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((totalXP % 500) / 500) * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Nível {userLevel}</span>
                  <span>Nível {userLevel + 1}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Conquistas */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center"
              >
                <Target className="w-4 h-4 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-foreground">Suas Conquistas</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  title: 'Sequência Atual',
                  value: `${userStats.currentStreak} dias`,
                  icon: '🔥',
                  gradient: 'from-orange-500/10 to-red-500/10',
                  border: 'border-orange-200/50',
                  description: 'Dias consecutivos'
                },
                {
                  title: 'Melhor Sequência',
                  value: `${userStats.bestStreak} dias`,
                  icon: '⚡',
                  gradient: 'from-yellow-500/10 to-orange-500/10',
                  border: 'border-yellow-200/50',
                  description: 'Recorde pessoal'
                },
                {
                  title: 'Dias Perfeitos',
                  value: `${userStats.perfectDays} dias`,
                  icon: '⭐',
                  gradient: 'from-blue-500/10 to-cyan-500/10',
                  border: 'border-blue-200/50',
                  description: '100% da meta'
                },
                {
                  title: 'Consistência',
                  value: `${userStats.averageCompletion}%`,
                  icon: '📊',
                  gradient: 'from-emerald-500/10 to-teal-500/10',
                  border: 'border-emerald-200/50',
                  description: 'Média geral'
                },
                {
                  title: 'Metas Atingidas',
                  value: `${userStats.totalGoalsAchieved}`,
                  icon: '🎯',
                  gradient: 'from-purple-500/10 to-pink-500/10',
                  border: 'border-purple-200/50',
                  description: 'Objetivos completos'
                },
                {
                  title: 'Total de Água',
                  value: `${(userStats.totalWaterConsumed / 1000).toFixed(1)}L`,
                  icon: '💧',
                  gradient: 'from-cyan-500/10 to-blue-500/10',
                  border: 'border-cyan-200/50',
                  description: 'Volume consumido'
                },
                {
                  title: 'Dias Rastreados',
                  value: `${userStats.totalDaysTracked}`,
                  icon: '📅',
                  gradient: 'from-indigo-500/10 to-purple-500/10',
                  border: 'border-indigo-200/50',
                  description: 'Histórico completo'
                },
                {
                  title: 'XP Total',
                  value: `${totalXP}`,
                  icon: '✨',
                  gradient: 'from-pink-500/10 to-rose-500/10',
                  border: 'border-pink-200/50',
                  description: 'Experiência acumulada'
                }
              ].map((achievement, index) => (
                <motion.div
                  key={achievement.title}
                  className={`bg-gradient-to-br ${achievement.gradient} p-3 rounded-xl border ${achievement.border} relative overflow-hidden group`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -1 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10 text-center">
                    <motion.div
                      className="text-xl mb-2"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: index * 0.1 }}
                    >
                      {achievement.icon}
                    </motion.div>
                    <p className="text-base font-bold text-foreground mb-1">{achievement.value}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{achievement.title}</p>
                    {achievement.description && (
                      <p className="text-xs text-muted-foreground/70 mt-1">{achievement.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="tips">
          <TipsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}