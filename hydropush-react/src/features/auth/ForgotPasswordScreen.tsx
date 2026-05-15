import React, { useState } from 'react';
import { ArrowLeft, Mail, Download, Upload, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { storageService } from '../../core/services/StorageService';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  error?: string | null;
  onError?: (error: string | null) => void;
}

export function ForgotPasswordScreen({ onBack, error, onError }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'input' | 'instructions'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    onError?.(null);

    try {
      // Simular processo de recuperação (sem backend real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se o email existe nos dados locais
      const authData = storageService.loadAuthData();
      if (authData.user?.email === email) {
        setStep('instructions');
      } else {
        onError?.('Email não encontrado em nossos registros locais.');
      }
    } catch {
      onError?.('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportBackup = () => {
    try {
      onError?.(null);
      setExportSuccess(false);
      
      // Criar backup real usando storageService
      const backupString = storageService.createBackup();
      
      // Criar arquivo para download
      const blob = new Blob([backupString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hydropush-backup-${new Date().toLocaleDateString('en-CA')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
      
    } catch (err) {
      console.error('Erro ao exportar backup:', err);
      onError?.('Erro ao exportar backup. Tente novamente.');
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        onError?.(null);
        setImportSuccess(false);
        setIsLoading(true);
        
        const backupString = e.target?.result as string;
        const success = storageService.restoreBackup(backupString);
        
        if (success) {
          setImportSuccess(true);
          setTimeout(() => setImportSuccess(false), 3000);
          onError?.(null);
        } else {
          onError?.('Formato de arquivo inválido ou corrompido.');
        }
      } catch (err) {
        console.error('Erro ao importar backup:', err);
        onError?.('Erro ao importar backup. Verifique o arquivo.');
      } finally {
        setIsLoading(false);
        // Limpar input
        event.target.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const getBackupStats = () => {
    const stats = storageService.getStorageStats();
    return {
      totalDays: stats.totalDays,
      totalEntries: stats.totalEntries,
      totalWater: (stats.totalWater / 1000).toFixed(1)
    };
  };

  const backupStats = getBackupStats();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">
            Esqueci minha senha
          </h1>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-destructive/10 border border-destructive rounded-lg p-4"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Mensagem de sucesso */}
        {exportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Backup exportado com sucesso!
              </p>
            </div>
          </motion.div>
        )}

        {importSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Dados importados com sucesso! Recarregue o app.
              </p>
            </div>
          </motion.div>
        )}

        {step === 'input' && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw size={24} className="text-white" />
              </div>
              <p className="text-muted-foreground">
                Digite seu email para verificar sua conta local
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Seu email cadastrado"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1E88E5] hover:bg-[#1565C0]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Email'
                )}
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">ou</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Estatísticas do backup */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Seus Dados Locais
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
                    <div>
                      <p className="font-medium">{backupStats.totalDays} dias</p>
                      <p className="text-blue-600 dark:text-blue-400">rastreados</p>
                    </div>
                    <div>
                      <p className="font-medium">{backupStats.totalEntries} registros</p>
                      <p className="text-blue-600 dark:text-blue-400">de consumo</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Recuperação Local
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    Como seus dados ficam armazenados localmente:
                  </p>
                  <div className="space-y-2">
                    <Button
                      onClick={handleExportBackup}
                      variant="outline"
                      className="w-full border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-200 dark:hover:bg-yellow-900/30"
                      disabled={isLoading}
                    >
                      <Download size={16} className="mr-2" />
                      Exportar Backup dos Dados
                    </Button>

                    <div className="relative">
                      <Input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackup}
                        className="hidden"
                        id="backup-import"
                      />
                      <label
                        htmlFor="backup-import"
                        className="flex items-center justify-center w-full px-4 py-2 text-sm border border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-200 dark:hover:bg-yellow-900/30 rounded-md cursor-pointer transition-colors"
                      >
                        <Upload size={16} className="mr-2" />
                        Importar Backup
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Nova Instalação
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                    Se você tem um backup salvo:
                  </p>
                  <ol className="text-xs text-green-600 dark:text-green-400 space-y-1 ml-4 list-decimal">
                    <li>Crie uma nova conta</li>
                    <li>Use "Importar Dados" nas configurações</li>
                    <li>Selecione seu arquivo de backup</li>
                    <li>Seus dados serão restaurados</li>
                  </ol>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 'instructions' && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Email Verificado!
              </h2>
              <p className="text-muted-foreground">
                Encontramos sua conta: <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-2">
                  Como acessar sua conta:
                </h3>
                <ol className="text-sm text-muted-foreground space-y-2 ml-4 list-decimal">
                  <li>Lembre-se que não há senha no modo local</li>
                  <li>Se reinstalou o app, use "Importar Backup"</li>
                  <li>Se mudou de dispositivo, exporte o backup primeiro</li>
                  <li>Seus dados estão seguros localmente</li>
                </ol>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Dica importante:</strong><br />
                  Faça backup regularmente para não perder seus dados em caso de reinstalação.
                </p>
              </div>

              {/* Botão rápido de exportar */}
              <Button
                onClick={handleExportBackup}
                variant="outline"
                className="w-full border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300"
              >
                <Download size={16} className="mr-2" />
                Fazer Backup Agora
              </Button>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setStep('input')}
                variant="outline"
                className="w-full"
              >
                Verificar outro email
              </Button>

              <Button
                onClick={onBack}
                className="w-full bg-[#1E88E5] hover:bg-[#1565C0]"
              >
                Voltar ao login
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}