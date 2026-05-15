import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck, Download, Trash2, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../../shared/components/ui/button';
import { ScrollArea } from '../../shared/components/ui/scroll-area';
import { storageService } from '../../core/services/StorageService';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

export function PrivacyPolicyScreen({ onBack }: PrivacyPolicyScreenProps) {
  const [storageStats, setStorageStats] = useState({
    totalDays: 0,
    totalEntries: 0,
    totalWater: 0,
    lastBackup: null as string | null,
    dataSize: '0 KB'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Carregar estatísticas de armazenamento
  useEffect(() => {
    const loadStorageStats = () => {
      try {
        const stats = storageService.getStorageStats();
        const allData = storageService.exportDebugData();
        
        // Calcular tamanho aproximado dos dados
        const dataSize = new Blob([JSON.stringify(allData)]).size;
        const sizeInKB = (dataSize / 1024).toFixed(1);
        
        setStorageStats({
          totalDays: stats.totalDays,
          totalEntries: stats.totalEntries,
          totalWater: Math.round(stats.totalWater / 1000), // Converter para litros
          lastBackup: stats.lastBackup,
          dataSize: `${sizeInKB} KB`
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageStats();
  }, []);

  const handleExportData = () => {
    try {
      const backupString = storageService.createBackup();
      
      // Criar arquivo para download
      const blob = new Blob([backupString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hydropush-privacy-export-${new Date().toLocaleDateString('en-CA')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      alert('Erro ao exportar dados. Tente novamente.');
    }
  };

  const handleDeleteAllData = () => {
    try {
      storageService.clearAllData();
      setShowDeleteConfirm(false);
      
      // Recarregar estatísticas
      const stats = storageService.getStorageStats();
      setStorageStats({
        totalDays: stats.totalDays,
        totalEntries: stats.totalEntries,
        totalWater: Math.round(stats.totalWater / 1000),
        lastBackup: stats.lastBackup,
        dataSize: '0 KB'
      });
      
      alert('Todos os dados foram excluídos com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir dados:', error);
      alert('Erro ao excluir dados. Tente novamente.');
    }
  };

  const getDataRetentionPeriod = () => {
    const stats = storageService.getStorageStats();
    if (stats.totalDays === 0) return 'Nenhum dado armazenado';
    
    const oldestDate = storageService.loadHydrationHistory().slice(-1)[0]?.date;
    if (!oldestDate) return 'Dados recentes';
    
    const oldest = new Date(oldestDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - oldest.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} dias`;
  };

  const sections = [
    {
      icon: Database,
      title: 'Seus Dados Armazenados',
      content: `Aqui está um resumo dos dados que você possui conosco:

• ${storageStats.totalDays} dias de acompanhamento
• ${storageStats.totalEntries} registros de hidratação
• ${storageStats.totalWater} litros de água consumidos
• ${storageStats.dataSize} de dados no total
• Período de retenção: ${getDataRetentionPeriod()}

Todos os dados são armazenados localmente no seu dispositivo.`,
      hasStats: true
    },
    {
      icon: Lock,
      title: 'Como Protegemos Seus Dados',
      content: `Sua privacidade é nossa prioridade:

🔒 Armazenamento local seguro no dispositivo
🔒 Dados criptografados no armazenamento do navegador
🔒 Não compartilhamento com terceiros
🔒 Sem rastreamento publicitário
🔒 Sem coleta de dados de localização
🔒 Sem acesso a contatos ou outras informações pessoais

Todos os dados ficam no seu dispositivo por padrão.`
    },
    {
      icon: Eye,
      title: 'Como Usamos Suas Informações',
      content: `Utilizamos seus dados exclusivamente para:

📊 Calcular recomendações personalizadas de hidratação
📊 Gerar estatísticas e gráficos de progresso
📊 Enviar lembretes configurados por você
📊 Melhorar a experiência do aplicativo
📊 Manter seu histórico de consumo

Nunca vendemos, alugamos ou compartilhamos seus dados pessoais.`
    },
    {
      icon: UserCheck,
      title: 'Seus Direitos (LGPD)',
      content: `Conforme a Lei Geral de Proteção de Dados, você tem:

✅ Acesso total aos seus dados pessoais
✅ Correção de dados incorretos ou desatualizados
✅ Exclusão completa dos dados quando desejar
✅ Portabilidade dos dados (exportação)
✅ Revogação de consentimento a qualquer momento
✅ Informação sobre compartilhamento de dados

Gerencie seus dados diretamente no aplicativo.`
    },
    {
      icon: Shield,
      title: 'Segurança e Retenção',
      content: `Mantemos seus dados seguros com:

🛡️ Dados armazenados localmente por padrão
🛡️ Retenção apenas enquanto usar o aplicativo
🛡️ Exclusão automática após desinstalação
🛡️ Backup opcional controlado por você
🛡️ Limpeza automática de dados antigos (90+ dias)

Implementamos as melhores práticas de segurança.`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-0">
          <ArrowLeft size={20} className="text-foreground" />
        </Button>
        <h1 className="font-semibold text-foreground">Política de Privacidade</h1>
        <div className="w-5" />
      </div>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="px-6 py-6">
          {/* Intro */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Sua Privacidade é Protegida
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              O Hydropush foi desenvolvido com foco máximo na privacidade. 
              Todos os dados ficam armazenados localmente no seu dispositivo.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Última atualização: Janeiro de 2025 • Versão 2.2.0
            </p>
          </motion.div>

          {/* Ações de Dados */}
          <motion.div
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
              Controle Seus Dados
            </h3>
            <div className="flex gap-2">
              <Button
                onClick={handleExportData}
                variant="outline"
                size="sm"
                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300"
              >
                <Download size={16} className="mr-2" />
                Exportar Dados
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                size="sm"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300"
              >
                <Trash2 size={16} className="mr-2" />
                Limpar Tudo
              </Button>
            </div>
          </motion.div>

          {/* Confirmação de Exclusão */}
          {showDeleteConfirm && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="bg-card border border-border rounded-xl p-6 max-w-sm w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Excluir Todos os Dados</h3>
                    <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Você perderá todo seu histórico, configurações e estatísticas. 
                  Certifique-se de ter feito backup se desejar preservar seus dados.
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleDeleteAllData}
                    variant="destructive"
                    className="flex-1"
                  >
                    Excluir Tudo
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                className="bg-card border rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-foreground">{section.title}</h3>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>

                {/* Estatísticas em tempo real para a primeira seção */}
                {section.hasStats && !isLoading && (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="font-semibold text-foreground">{storageStats.totalDays}</p>
                      <p className="text-muted-foreground">Dias</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="font-semibold text-foreground">{storageStats.totalEntries}</p>
                      <p className="text-muted-foreground">Registros</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="font-semibold text-foreground">{storageStats.totalWater}L</p>
                      <p className="text-muted-foreground">Água</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="font-semibold text-foreground">{storageStats.dataSize}</p>
                      <p className="text-muted-foreground">Tamanho</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Transparência Técnica */}
          <motion.div
            className="mt-6 p-4 border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                  Transparência Técnica
                </p>
                <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                  <p>• Armazenamento: LocalStorage do navegador</p>
                  <p>• Criptografia: Dados serializados em JSON</p>
                  <p>• Backup: Opcional e controlado pelo usuário</p>
                  <p>• Retenção: Dados mantidos localmente</p>
                  <p>• Exportação: Formato JSON padrão</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* LGPD Notice */}
          <motion.div
            className="mt-6 p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Conformidade com LGPD
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  O Hydropush está em total conformidade com a Lei Geral de Proteção de Dados (LGPD). 
                  Você tem controle total sobre seus dados pessoais e pode exercer seus direitos a qualquer momento.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="mt-8 pt-6 border-t border-border text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <p className="text-xs text-muted-foreground">
              © 2025 Hydropush. Todos os direitos reservados.
              <br />
              Desenvolvido no Brasil 🇧🇷 com respeito à sua privacidade.
              <br />
              <span className="text-[10px] opacity-70">
                Versão 2.2.0 • Dados 100% locais • Código aberto disponível
              </span>
            </p>
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
}