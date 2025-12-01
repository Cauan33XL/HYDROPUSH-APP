/**
 * Design Tokens para o Hydropush
 * Valores configuráveis para regras de negócio e limites
 */

export const DESIGN_TOKENS = {
  // Limites de peso e cálculo de meta
  WEIGHT: {
    MAX_HUMAN_KG: 635, // Valor histórico de referência - configurável
    MIN_RECOMMENDED_ML_PER_KG: 30, // Limite inferior recomendado
    MAX_RECOMMENDED_ML_PER_KG: 35, // Limite superior recomendado
    EXTREME_LIMIT_ML_PER_KG: 50, // Limite considerado extremo
  },

  // Cores para alertas
  COLORS: {
    DANGER_SOFT: '#FECACA', // Tom avermelhado-claro para botão Desfazer
    DANGER_SOFT_HOVER: '#FCA5A5', // Hover mais saturado
    DANGER_SOFT_DARK: '#7F1D1D', // Versão escura
    WATER_GOAL_CHART: '#4ECDC4', // Azul esverdeado para meta no gráfico
  },

  // Conquistas - Ordem e nomes
  ACHIEVEMENTS: {
    RANKS: [
      { name: 'Bronze', emoji: '🥉', color: '#CD7F32' },
      { name: 'Prata', emoji: '🥈', color: '#C0C0C0' },
      { name: 'Ouro', emoji: '🏆', color: '#FFD700' },
      { name: 'Esmeralda', emoji: '💎', color: '#50C878' },
      { name: 'Rubi', emoji: '🔴', color: '#E0115F' },
      { name: 'Diamante', emoji: '💠', color: '#B9F2FF' },
    ],
    REQUIREMENTS: {
      BRONZE: { days: 3, volume: 6000 },
      PRATA: { days: 7, volume: 21000 },
      OURO: { days: 15, volume: 50000 },
      ESMERALDA: { days: 30, volume: 100000 },
      RUBI: { days: 60, volume: 200000 },
      DIAMANTE: { days: 100, volume: 350000 },
    }
  },

  // Configurações de UI
  UI: {
    UNDO_BUTTON_TIMEOUT: 20000, // 20 segundos para desfazer
    TOAST_DURATION: 3000, // 3 segundos para snackbar
    ANIMATION_DURATION: 300,
  },

  // Strings traduzíveis
  STRINGS: {
    WEIGHT_MAX_TOOLTIP: 'Máx.: 635 kg (valor histórico de referência — configurável)',
    WEIGHT_MAX_SOURCE: 'Wikipedia',
    GOAL_ALERT_BELOW: '⚠️ Sua meta atual está abaixo da recomendação.',
    GOAL_ALERT_EXTREME: '⚠️ Sua meta atual está em nível extremo.',
    GOAL_ADJUST_CTA: 'Ajustar para',
    UNDO_SNACKBAR: 'Entrada removida',
    UNDO_ACTION: 'Desfazer',
  }
} as const;

// Utilitários para cálculos
export const calculateRecommendedIntake = (weightKg: number) => {
  const minIntake = weightKg * DESIGN_TOKENS.WEIGHT.MIN_RECOMMENDED_ML_PER_KG;
  const recommended = weightKg * DESIGN_TOKENS.WEIGHT.MAX_RECOMMENDED_ML_PER_KG;
  return { minIntake, recommended };
};

export const isGoalWithinRecommendation = (goalMl: number, weightKg: number) => {
  const { minIntake } = calculateRecommendedIntake(weightKg);
  const extremeLimit = weightKg * DESIGN_TOKENS.WEIGHT.EXTREME_LIMIT_ML_PER_KG;
  
  if (goalMl < minIntake) return 'below';
  if (goalMl > extremeLimit) return 'extreme';
  return 'ok';
};

/**
 * Design system token names exposed for sync with CSS variables.
 * Keep these names in sync with `src/styles/globals.css` to ensure components
 * can reference the CSS variables at runtime or during SSR styling.
 */
export const CSS_TOKENS = {
  COLOR_BG: '--color-bg',
  COLOR_SURFACE: '--color-surface',
  COLOR_FOREGROUND: '--color-foreground',
  GLASS_BG: '--glass-bg',
  GLASS_BG_DARK: '--glass-bg-dark',
  GLASS_BORDER: '--glass-border',
  RADIUS_SM: '--radius-sm',
  RADIUS_MD: '--radius-md',
  RADIUS_LG: '--radius-lg',
  SPACE_1: '--space-1',
  SPACE_2: '--space-2',
  SPACE_3: '--space-3',
  SPACE_4: '--space-4',
  SHADOW_SUBTLE: '--shadow-subtle',
  GLASS_BLUR: '--glass-blur',
  ANIM_FAST: '--anim-fast',
  ANIM_MEDIUM: '--anim-medium',
} as const;

export type CssTokenKey = keyof typeof CSS_TOKENS;

/**
 * Helper para obter valor de token CSS (browser runtime). Retorna null em SSR.
 */
export const getCssToken = (token: CssTokenKey) => {
  if (typeof window === 'undefined' || !window.getComputedStyle) return null;
  return getComputedStyle(document.documentElement).getPropertyValue(CSS_TOKENS[token]).trim();
};