import React, { useState } from 'react';
import { Plus, Undo2, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { WaterGlass } from './WaterGlass';
import { DESIGN_TOKENS } from '../../constants/designTokens';

interface HydrationData {
  currentAmount: number;
  dailyGoal: number;
  userName: string;
}

export interface HydrationDashboardProps {
  data: HydrationData;
  onAddDrink: (amount: number) => void;
  onReset?: () => void;
  isLoading?: boolean;
}

export function HydrationDashboard({ data, onAddDrink, onReset, isLoading = false }: HydrationDashboardProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [lastAddedAmount, setLastAddedAmount] = useState(0);
  const [showUndo, setShowUndo] = useState(false);

  const percentage = Math.min(Math.round((data.currentAmount / data.dailyGoal) * 100), 100);

  const handleQuickAdd = (amount: number) => {
    if (isLoading) return;

    onAddDrink(amount);
    setLastAddedAmount(amount);

    setShowUndo(true);
    setTimeout(() => setShowUndo(false), DESIGN_TOKENS.UI.UNDO_BUTTON_TIMEOUT);

    // Toast sutil confirmando adição
    toast.success(`+${amount}ml adicionados`, {
      duration: 2000,
    });

    // navigator.vibrate?.(50); // REMOVIDO: Evitar vibração fantasma
  };

  const handleUndo = () => {
    if (isLoading) return;

    if (lastAddedAmount > 0) {
      onAddDrink(-lastAddedAmount);
      setLastAddedAmount(0);
      setShowUndo(false);
      // navigator.vibrate?.(100); // REMOVIDO: Evitar vibração fantasma
    }
  };

  const handleCustomAdd = () => {
    if (isLoading) return;

    const amount = parseInt(customAmount);
    if (amount > 0) {
      onAddDrink(amount);
      setCustomAmount('');
      setShowCustomInput(false);
      // navigator.vibrate?.(50); // REMOVIDO: Evitar vibração fantasma
    }
  };

  const handleReset = () => {
    if (isLoading || !onReset) return;

    onReset();
    setShowUndo(false);
    setLastAddedAmount(0);
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Loading Overlay */}
        {isLoading && (
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </motion.div>
        )}

        {/* Cabeçalho de Status */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {data.currentAmount === 0 ? (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Vamos começar o dia! 🌅
              </h1>
              <p className="text-base text-muted-foreground mb-4">
                Sua jornada de hidratação começa agora
              </p>
              <motion.div
                className="max-w-md mx-auto p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <p className="text-base text-blue-800 dark:text-blue-200 font-semibold mb-1">
                  Meta de hoje: {(data.dailyGoal / 1000).toFixed(1)}L
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Comece com um copo d'água! 💧
                </p>
              </motion.div>
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Continue assim! 💪
              </h1>
              <p className="text-base text-muted-foreground">
                Você está no caminho certo
              </p>
            </>
          )}
        </motion.div>

        {/* Copo de Água Principal - Centralizado */}
        <motion.div
          className="flex items-center justify-center py-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.3,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <WaterGlass
            currentAmount={data.currentAmount}
            dailyGoal={data.dailyGoal}
            size="lg"
            animated={true}
          />
        </motion.div>

        {/* Botão Desfazer - Centralizado */}
        {showUndo && (
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <button
              onClick={handleUndo}
              disabled={isLoading}
              className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-5 py-2.5 rounded-full border border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Undo2 size={18} />
              <span className="text-sm font-medium">Desfazer (+{lastAddedAmount}ml)</span>
            </button>
          </motion.div>
        )}

        {/* Seção Quick Add Buttons */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
            Adicionar rapidamente
          </h3>

          {/* Grid de 3 colunas para os botões principais */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { amount: 100, label: 'Pequeno', sublabel: '100ml', icon: '💧' },
              { amount: 200, label: 'Médio', sublabel: '200ml', icon: '💦' },
              { amount: 500, label: 'Grande', sublabel: '500ml', icon: '🌊' },
            ].map((quickAdd, index) => (
              <motion.button
                key={quickAdd.amount}
                onClick={() => handleQuickAdd(quickAdd.amount)}
                disabled={isLoading}
                className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-800/30 py-4 px-3 rounded-xl border border-blue-200 dark:border-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
                whileHover={isLoading ? {} : { y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.6 + (index * 0.1),
                  duration: 0.4,
                }}
              >
                <motion.div
                  className="text-3xl mb-2"
                  whileHover={isLoading ? {} : { scale: 1.2, rotate: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {quickAdd.icon}
                </motion.div>
                <span className="font-semibold text-sm text-foreground text-center leading-tight">
                  {quickAdd.label}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {quickAdd.sublabel}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Botão Personalizar em linha separada */}
          <motion.button
            onClick={() => setShowCustomInput(!showCustomInput)}
            disabled={isLoading}
            className="w-full py-3.5 border-2 border-dashed border-primary/50 text-primary rounded-xl transition-all duration-200 hover:bg-primary/5 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
          >
            <div className="flex items-center justify-center gap-2">
              <motion.div
                whileHover={isLoading ? {} : { rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <Plus size={20} />
              </motion.div>
              <span className="font-semibold">Quantidade Personalizada</span>
            </div>
          </motion.button>
        </motion.div>

        {/* Input Personalizado */}
        {showCustomInput && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Quantidade personalizada (ml)
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Ex: 300"
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  min="1"
                  max="2000"
                  disabled={isLoading}
                />
                <motion.button
                  onClick={handleCustomAdd}
                  disabled={!customAmount || parseInt(customAmount) <= 0 || isLoading}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                >
                  Adicionar
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Histórico do Dia */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Histórico do dia</h3>
            {onReset && data.currentAmount > 0 && (
              <motion.button
                onClick={handleReset}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw size={16} />
                Resetar
              </motion.button>
            )}
          </div>

          {data.currentAmount === 0 ? (
            <motion.div
              className="text-center py-8 bg-card border border-border rounded-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.4 }}
            >
              <motion.div
                className="text-6xl mb-4"
                layout={false}
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                💧
              </motion.div>
              <p className="text-base text-muted-foreground font-medium mb-1">
                Ainda não registrou hoje
              </p>
              <p className="text-sm text-muted-foreground/70">
                Vamos começar a hidratação?
              </p>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.4 }}
            >
              <motion.div
                className="flex items-center justify-between p-5 bg-card border border-border rounded-xl shadow-sm hover:shadow-md"
                initial={{ opacity: 0, y: 15, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                // disable layout projection to avoid motion automatically writing transforms
                layout={false}
                whileHover={{ y: -2 }}
                transition={{
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-2xl">💧</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base text-foreground">Total consumido</p>
                    <p className="text-sm text-muted-foreground">Hoje</p>
                  </div>
                </div>
                <motion.span
                  className="text-xl font-bold text-primary"
                  key={data.currentAmount}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, type: "spring" }}
                >
                  {data.currentAmount}ml
                </motion.span>
              </motion.div>

              {percentage >= 100 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  className="p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center"
                >
                  <motion.div
                    className="text-3xl mb-3"
                    animate={{
                      scale: [1, 1.3, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: 3
                    }}
                  >
                    🎉
                  </motion.div>
                  <p className="font-bold text-lg text-green-800 dark:text-green-200 mb-1">
                    Meta alcançada!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Parabéns, você bateu sua meta de hoje!
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}