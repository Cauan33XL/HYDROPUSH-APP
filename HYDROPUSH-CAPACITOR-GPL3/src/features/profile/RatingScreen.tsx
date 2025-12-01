import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Heart, Send, MessageCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../../shared/components/ui/button';
import { Textarea } from '../../shared/components/ui/textarea';
import { storageService } from '../../core/services/StorageService';

interface RatingScreenProps {
  onBack: () => void;
}

interface FeedbackData {
  rating: number;
  feedback: string;
  date: string;
  appVersion: string;
  userStats?: {
    totalDays: number;
    totalWater: number;
    currentStreak: number;
  };
}

export function RatingScreen({ onBack }: RatingScreenProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRatedBefore, setHasRatedBefore] = useState(false);

  // Verificar se usuário já avaliou antes
  useEffect(() => {
    const checkPreviousRating = () => {
      try {
        const previousFeedback = storageService.loadFeedback();
        if (previousFeedback) {
          setHasRatedBefore(true);
          setRating(previousFeedback.rating);
          setFeedback(previousFeedback.feedback || '');
        }
      } catch (err) {
        console.error('Erro ao verificar avaliação anterior:', err);
      }
    };

    checkPreviousRating();
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Por favor, selecione uma avaliação com as estrelas');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Coletar estatísticas do usuário para contexto
      const userStats = storageService.getStorageStats();
      const appStats = storageService.loadUserStats();

      const feedbackData: FeedbackData = {
        rating,
        feedback: feedback.trim(),
        date: new Date().toISOString(),
        appVersion: '2.2.0', // Corrigindo para a versão atual do app
        userStats: {
          totalDays: userStats.totalDays,
          totalWater: userStats.totalWater,
          currentStreak: appStats.currentStreak
        }
      };

      // Salvar feedback localmente
      storageService.saveFeedback(feedbackData);

      // Se avaliação for 4 ou 5 estrelas, direcionar para loja
      if (rating >= 4) {
        handleRateInStore();
      } else {
        console.log('Avaliação salva localmente:', feedbackData);
        
        // Para avaliações baixas, podemos enviar para um endpoint futuro
        // await sendFeedbackToServer(feedbackData);
      }

      setSubmitted(true);
      
      // Voltar após 3 segundos
      setTimeout(() => {
        onBack();
      }, 3000);

    } catch (err) {
      console.error('Erro ao enviar avaliação:', err);
      setError('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateInStore = () => {
    // URLs das lojas de aplicativo
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.hydropush.app';
    const appStoreUrl = 'https://apps.apple.com/app/hydropush/id123456789';
    
    // Usar InAppBrowser para uma experiência mais controlada
    const w = window as unknown as { cordova?: { InAppBrowser?: { open?: (url: string, target?: string) => void } } };
    if (typeof w.cordova !== 'undefined' && w.cordova?.InAppBrowser) {
      const isAndroid = /Android/.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

      let storeUrl = playStoreUrl; // Fallback
      if (isAndroid) {
        storeUrl = 'market://details?id=com.hydropush.app';
      } else if (isIOS) {
        storeUrl = appStoreUrl; // O iOS lida bem com o link https da App Store
      } else {
        storeUrl = playStoreUrl;
      }
      // Abre no navegador do sistema, que é o comportamento desejado para links de loja
      w.cordova?.InAppBrowser?.open?.(storeUrl, '_system');
    } else {
      // Fallback para ambiente de navegador
      const url = /iPhone|iPad|iPod/.test(navigator.userAgent) ? appStoreUrl : playStoreUrl;
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    try {
  // Marcar que o usuário foi direcionado para avaliar
  storageService.saveAppSettings({ lastRatingPrompt: new Date().toISOString() });
      
    } catch (error) {
      console.error('Erro ao abrir loja:', error);
      // Fallback final
      window.open(playStoreUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getRatingText = (stars: number) => {
    switch (stars) {
      case 1: return 'Muito Ruim 😞';
      case 2: return 'Ruim 😕';
      case 3: return 'Regular 😐';
      case 4: return 'Bom 😊';
      case 5: return 'Excelente! 🤩';
      default: return 'Como você avalia o Hydropush?';
    }
  };

  const getRatingDescription = (stars: number) => {
    switch (stars) {
      case 1: return 'Nos conte o que podemos melhorar';
      case 2: return 'O que não está funcionando bem?';
      case 3: return 'Como podemos ser melhores?';
      case 4: return 'Obrigado! O que você mais gosta?';
      case 5: return 'Incrível! Compartilhe sua experiência';
      default: return 'Sua opinião é muito importante para nós';
    }
  };

  const quickFeedbackOptions = [
    'Interface confusa',
    'Muitas notificações',
    'Falta funcionalidades',
    'App lento ou travando',
    'Problemas com notificações',
    'Dificuldade de usar',
    'Design pouco intuitivo',
    'Consome muita bateria',
    'Outro problema'
  ];

  const positiveFeedbackOptions = [
    'Interface bonita e intuitiva',
    'Lembretes úteis',
    'Estatísticas detalhadas',
    'Fácil de usar',
    'Design moderno',
    'Funciona perfeitamente',
    'Ajudou na hidratação',
    'Personalização boa',
    'Outro elogio'
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-background px-6 py-8 flex items-center justify-center">
        <motion.div 
          className="text-center max-w-sm w-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Heart className="w-10 h-10 text-green-600 dark:text-green-400" fill="currentColor" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {rating >= 4 ? 'Obrigado!' : 'Feedback Recebido!'}
          </h2>
          
          <p className="text-muted-foreground mb-4">
            {rating >= 4 
              ? 'Sua avaliação nos motiva a continuar melhorando! ⭐'
              : 'Vamos usar seu feedback para melhorar o aplicativo.'
            }
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-muted-foreground"
          >
            <p>Voltando automaticamente...</p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-0">
          <ArrowLeft size={20} className="text-foreground" />
        </Button>
        <h1 className="font-semibold text-foreground">
          {hasRatedBefore ? 'Sua Avaliação' : 'Avaliar o Hydropush'}
        </h1>
        <div className="w-5" />
      </div>

      <div className="px-6 py-8">
        {/* Mensagem de erro */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm"
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Rating Section */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <motion.span 
              className="text-4xl"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💧
            </motion.span>
          </div>
          
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {getRatingText(hoveredRating || rating)}
          </h2>
          
          <p className="text-muted-foreground mb-6">
            {getRatingDescription(hoveredRating || rating)}
          </p>

          {/* Stars */}
          <div className="flex justify-center gap-1 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-2"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
                disabled={isLoading}
              >
                <Star
                  size={44}
                  className={`transition-all duration-200 ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-yellow-400 drop-shadow-lg'
                      : 'text-gray-300 dark:text-gray-600'
                  } ${isLoading ? 'opacity-50' : ''}`}
                />
              </motion.button>
            ))}
          </div>

          {hasRatedBefore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 inline-block"
            >
              <MessageCircle size={14} className="inline mr-1" />
              Você já avaliou anteriormente. Pode atualizar sua avaliação.
            </motion.div>
          )}
        </motion.div>

        {/* Feedback Section */}
        {rating > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="font-medium text-foreground">
              {rating >= 4 ? 'Compartilhe sua experiência' : 'Nos ajude a melhorar'}
            </h3>
            
            <Textarea
              placeholder={
                rating >= 4 
                  ? "O que você mais gosta no Hydropush? Suas sugestões são bem-vindas!"
                  : "O que não está funcionando bem? Como podemos melhorar?"
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isLoading}
            />

            {/* Quick feedback options */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                {rating >= 4 ? 'Marcar como positivo:' : 'Selecione os principais problemas:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {(rating >= 4 ? positiveFeedbackOptions : quickFeedbackOptions).map((option) => (
                  <motion.button
                    key={option}
                    type="button"
                    onClick={() => setFeedback(prev => 
                      prev.includes(option) 
                        ? prev.replace(`, ${option}`, '').replace(option, '').trim()
                        : prev ? `${prev}, ${option}` : option
                    )}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      feedback.includes(option)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                    }`}
                    whileTap={{ scale: 0.95 }}
                    disabled={isLoading}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              className="w-full bg-[#1E88E5] hover:bg-[#1565C0] text-white"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={20} className="mr-2" />
                  {hasRatedBefore ? 'Atualizar Avaliação' : 'Enviar Avaliação'}
                </>
              )}
            </Button>

            {rating >= 4 && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Ao enviar, você será direcionado para avaliar na loja de aplicativos
              </p>
            )}
          </motion.div>
        )}

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted-foreground">
            Sua avaliação é armazenada localmente e anonimizada para análise.
            <br />
            Não coletamos dados pessoais identificáveis.
          </p>
        </motion.div>
      </div>
    </div>
  );
}