import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../shared/components/ui/button';

interface HelpSupportScreenProps {
  onBack: () => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export function HelpSupportScreen({ onBack }: HelpSupportScreenProps) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const faqs: FAQItem[] = [
    {
      id: 'goal',
      question: 'Como definir minha meta diária de água?',
      answer: 'Vá até a aba "Perfil" e clique em "Editar" na seção Meta Diária. Recomendamos 35ml por kg de peso corporal, ajustado pela atividade física.'
    },
    {
      id: 'notifications',
      question: 'Como ativar/desativar notificações?',
      answer: 'Acesse "Configurações" > "Notificações" para personalizar seus lembretes de hidratação. Você pode escolher horários e frequência.'
    },
    {
      id: 'history',
      question: 'Como visualizar meu histórico?',
      answer: 'Na aba "Histórico" você encontra todos os seus dados passados, incluindo gráficos semanais e mensais do seu consumo de água.'
    },
    {
      id: 'achievements',
      question: 'Como funcionam as conquistas?',
      answer: 'Na aba "Perfil" > "Conquistas" você pode ver todas as medalhas disponíveis. Elas são desbloqueadas automaticamente conforme você atinge metas e mantém sequências.'
    },
    {
      id: 'reset',
      question: 'Como redefinir meu progresso?',
      answer: 'Em "Configurações" > "Conta" > "Redefinir Dados". Atenção: esta ação não pode ser desfeita.'
    },
    {
      id: 'tracking',
      question: 'Como adicionar consumo de água?',
      answer: 'Na tela principal, use o botão "+" para adicionar diferentes quantidades de água. Você também pode usar os botões rápidos para copos de 200ml, 300ml ou 500ml.'
    },
    {
      id: 'recommendation',
      question: 'Como é calculada a recomendação diária?',
      answer: 'Baseamos a recomendação no seu peso corporal (35ml por kg) e nível de atividade física. Pessoas mais ativas podem precisar de mais água.'
    }
  ];

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-0">
          <ArrowLeft size={20} className="text-foreground" />
        </Button>
        <h1 className="font-semibold text-foreground">Ajuda e Suporte</h1>
        <div className="w-5" />
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Intro */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Como podemos ajudar?
          </h2>
          <p className="text-muted-foreground">
            Encontre respostas rápidas para suas dúvidas
          </p>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Perguntas Frequentes
          </h3>
          
          <div className="space-y-3">
            {faqs.map((faq) => (
              <motion.div
                key={faq.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="flex items-center justify-between w-full p-4 text-left hover:bg-accent/50 transition-colors"
                >
                  <span className="font-medium text-foreground pr-4">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown 
                      size={20} 
                      className="text-muted-foreground flex-shrink-0" 
                    />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {openFaq === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <p className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4"
        >
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-5 rounded-2xl">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="text-blue-600">💡</span>
              Dicas de Hidratação
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Beba um copo d'água ao acordar para acelerar o metabolismo
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Configure lembretes regulares durante o dia
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                Mantenha uma garrafa de água sempre por perto
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                Monitore a cor da urina como indicador de hidratação
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-2xl">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="text-green-600">⚡</span>
              Funcionalidades do App
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <strong>Meta Personalizada:</strong> Baseada no seu peso e atividade
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <strong>Lembretes Inteligentes:</strong> Adaptam-se ao seu horário
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                <strong>Sistema de Conquistas:</strong> Motivação para continuar
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                <strong>Gráficos Detalhados:</strong> Acompanhe seu progresso
              </p>
            </div>
          </div>
        </motion.div>

        {/* Seção de contato removida: suporte é local ao app, sem contatos externos */}

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center pt-4 border-t border-border"
        >
          <p className="text-sm text-muted-foreground">
            Hydropush v2.2.0 • Desenvolvido com 💧 para sua saúde
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            © 2024 Hydropush Team. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}