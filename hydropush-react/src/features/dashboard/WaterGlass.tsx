// src/components/WaterGlass.tsx
import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'motion/react';
import { storageService } from '../../core/services/StorageService';

interface WaterGlassProps {
  currentAmount: number;
  dailyGoal: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function WaterGlass({ currentAmount, dailyGoal, size = 'md', animated = true }: WaterGlassProps) {
  const controls = useAnimation();
  const [displayAmount, setDisplayAmount] = useState(0);
  const [previousAmount, setPreviousAmount] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Carregar configuração de movimento reduzido
  useEffect(() => {
    const appSettings = storageService.loadAppSettings();
    setReducedMotion(appSettings.reducedMotion);
  }, []);

  const percentage = Math.min((currentAmount / dailyGoal) * 100, 150); // Permitir até 150%
  const isOverflowing = currentAmount > dailyGoal;
  const fillHeight = Math.min((percentage / 100) * 85, 85); // 85% é a altura máxima do preenchimento para ficar realmente cheio

  const sizes = {
    sm: { width: 120, height: 160, strokeWidth: 3 },
    md: { width: 160, height: 200, strokeWidth: 4 },
    lg: { width: 200, height: 250, strokeWidth: 5 }
  };

  const { width, height, strokeWidth } = sizes[size];

  useEffect(() => {
    if (!animated || reducedMotion) {
      setDisplayAmount(currentAmount);
      return;
    }

    const difference = Math.abs(currentAmount - previousAmount);
    const duration = Math.min(Math.max(difference / 1000 * 0.8, 0.2), 0.9);

    // Animar o número
    const startValue = displayAmount;
    const endValue = currentAmount;
    const startTime = Date.now();

    const animateValue = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: cubic-bezier(0.22,1,0.36,1)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * easeOut;
      setDisplayAmount(Math.round(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };

    requestAnimationFrame(animateValue);

    // Animar o preenchimento do copo
    controls.start({
      height: `${fillHeight}%`,
      transition: {
        duration: duration,
        ease: [0.22, 1, 0.36, 1]
      }
    });

    setPreviousAmount(currentAmount);
  }, [currentAmount, animated, controls, fillHeight, displayAmount, previousAmount, reducedMotion]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="drop-shadow-sm"
        >
          {/* Definições de gradientes */}
          <defs>
            <linearGradient id="waterGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#A7E1FF" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#42A5F5" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#1E88E5" stopOpacity="1" />
            </linearGradient>
            
            {/* Gradiente especial para overflow */}
            <linearGradient id="overflowGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#40E0D0" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#00E5FF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00BFFF" stopOpacity="1" />
            </linearGradient>
            
            <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E3F2FD" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#BBDEFB" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#E3F2FD" stopOpacity="0.3" />
            </linearGradient>
            
            {/* Máscara para o formato do copo */}
            <mask id="glassMask">
              <rect width={width} height={height} fill="black" />
              <path
                d={`M ${width * 0.2} ${height * 0.1} 
                   L ${width * 0.8} ${height * 0.1}
                   L ${width * 0.75} ${height * 0.9}
                   Q ${width * 0.5} ${height * 0.95} ${width * 0.25} ${height * 0.9}
                   Z`}
                fill="white"
              />
            </mask>
            
            {/* Efeito de brilho da água */}
            <filter id="waterShine" x="0%" y="0%" width="100%" height="100%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1"/>
              <feOffset dx="1" dy="1" result="offset" />
            </filter>

            {/* Filtro de glow para overflow */}
            <filter id="overflowGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>
          </defs>

          {/* Fundo do copo (vidro) */}
          <path
            d={`M ${width * 0.2} ${height * 0.1} 
               L ${width * 0.8} ${height * 0.1}
               L ${width * 0.75} ${height * 0.9}
               Q ${width * 0.5} ${height * 0.95} ${width * 0.25} ${height * 0.9}
               Z`}
            fill="url(#glassGradient)"
            stroke="rgba(30, 136, 229, 0.3)"
            strokeWidth={strokeWidth}
          />

          {/* Preenchimento de água */}
          <g mask="url(#glassMask)">
            <motion.rect
              x={width * 0.2 + strokeWidth/2}
              y={height * 0.9 - (height * 0.85 * Math.min(fillHeight / 85, 1))} // Garantir que preencha completamente
              width={width * 0.6 - strokeWidth}
              initial={{ height: 0 }}
              animate={reducedMotion ? { height: `${Math.min(fillHeight, 85) * 0.85}%` } : controls}
              fill={isOverflowing ? "url(#overflowGradient)" : "url(#waterGradient)"}
              filter={isOverflowing ? "url(#overflowGlow)" : "url(#waterShine)"}
            />
            
            {/* Ondas da água (apenas se houver água) */}
            {fillHeight > 0 && !reducedMotion && (
              <motion.path
                d={`M ${width * 0.2} ${height * 0.9 - (height * 0.85 * Math.min(fillHeight / 85, 1))}
                   Q ${width * 0.3} ${height * 0.9 - (height * 0.85 * Math.min(fillHeight / 85, 1)) - 3}
                   ${width * 0.4} ${height * 0.9 - (height * 0.85 * Math.min(fillHeight / 85, 1))}
                   T ${width * 0.6} ${height * 0.9 - (height * 0.85 * Math.min(fillHeight / 85, 1))}
                   T ${width * 0.8} ${height * 0.9 - (height * 0.85 * Math.min(fillHeight / 85, 1))}`}
                fill="none"
                stroke={isOverflowing ? "#FFFFFF" : "#ffffff"}
                strokeWidth="2"
                opacity={isOverflowing ? "0.8" : "0.6"}
                animate={animated ? {
                  pathLength: [0, 1, 0],
                  opacity: isOverflowing ? [0.5, 0.8, 0.5] : [0.3, 0.6, 0.3]
                } : {}}
                transition={{
                  duration: isOverflowing ? 1.5 : 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}

            {/* Efeito de estouro/overflow visual */}
            {isOverflowing && fillHeight >= 85 && !reducedMotion && (
              <motion.g
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Partículas de estouro */}
                {[...Array(6)].map((_, i) => (
                  <motion.circle
                    key={i}
                    cx={width * 0.5 + (Math.sin(i * Math.PI / 3) * 15)}
                    cy={height * 0.15 + (Math.cos(i * Math.PI / 3) * 10)}
                    r="2"
                    fill="#00E5FF"
                    animate={{
                      y: [0, -10, -5],
                      opacity: [1, 0.5, 0],
                      scale: [0.5, 1, 0.3]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </motion.g>
            )}
          </g>

          {/* Borda do copo */}
          <path
            d={`M ${width * 0.2} ${height * 0.1} 
               L ${width * 0.8} ${height * 0.1}
               L ${width * 0.75} ${height * 0.9}
               Q ${width * 0.5} ${height * 0.95} ${width * 0.25} ${height * 0.9}
               Z`}
            fill="none"
            stroke={isOverflowing ? "#00E5FF" : "#1E88E5"}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isOverflowing ? "0.9" : "0.7"}
          />

          {/* Destacar a borda superior */}
          <line
            x1={width * 0.2}
            y1={height * 0.1}
            x2={width * 0.8}
            y2={height * 0.1}
            stroke={isOverflowing ? "#00E5FF" : "#1E88E5"}
            strokeWidth={strokeWidth + 1}
            strokeLinecap="round"
          />
        </svg>

        {/* Informações de progresso */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div 
            className="text-center"
            key={displayAmount}
            initial={animated && !reducedMotion ? { scale: 1.2, opacity: 0.5 } : {}}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className={`font-bold ${
              isOverflowing ? 'text-cyan-400' : 'text-[#1E88E5]'
            } ${
              size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl'
            }`}>
              {Math.round((currentAmount / dailyGoal) * 100)}%
            </div>
            <div className={`text-gray-600 dark:text-gray-400 ${
              size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs'
            }`}>
              {displayAmount}ml
            </div>
          </motion.div>
        </div>
      </div>

      {/* Indicador de meta */}
      <div className={`mt-4 text-center ${
        size === 'lg' ? 'text-sm' : size === 'md' ? 'text-xs' : 'text-xs'
      }`}>
        <div className="text-gray-500 dark:text-gray-400">
          Meta: {dailyGoal}ml ({(dailyGoal / 1000).toFixed(1)}L)
        </div>
        {currentAmount > 0 && currentAmount < dailyGoal && (
          <div className="text-[#1E88E5] font-medium mt-1">
            Faltam {dailyGoal - currentAmount}ml
          </div>
        )}
        {currentAmount >= dailyGoal && !isOverflowing && (
          <motion.div 
            className="text-[#00B894] font-semibold mt-1 flex items-center justify-center gap-1"
            initial={reducedMotion ? {} : { scale: 0 }}
            animate={reducedMotion ? {} : { scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <span>🎉</span>
            Meta alcançada!
          </motion.div>
        )}
        {isOverflowing && (
          <motion.div 
            className="text-cyan-400 font-bold mt-1 flex items-center justify-center gap-1"
            initial={reducedMotion ? {} : { scale: 0 }}
            animate={reducedMotion ? {} : { scale: [1, 1.1, 1] }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span>💎</span>
            Superou a meta!
            <span>💎</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}