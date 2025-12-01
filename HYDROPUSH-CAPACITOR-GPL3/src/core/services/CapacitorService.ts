import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App as CapApp } from '@capacitor/app';

/**
 * CapacitorService - Serviço centralizado para gerenciar plugins nativos do Capacitor
 * Inicializa e configura todos os plugins necessários para o app nativo funcionar corretamente
 */
class CapacitorService {
    private initialized = false;
    private platform: string = 'web';

    constructor() {
        this.platform = Capacitor.getPlatform();
    }

    /**
     * Inicializa todos os plugins nativos do Capacitor
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            console.log('[CapacitorService] Already initialized');
            return;
        }

        try {
            console.log('[CapacitorService] Starting initialization on platform:', this.platform);

            // Só inicializar plugins nativos se estiver em plataforma nativa
            if (this.isNativePlatform()) {
                await this.initializeStatusBar();
                await this.initializeSplashScreen();
                await this.initializeLocalNotifications();
                await this.initializePushNotifications();
                await this.initializeHaptics();
                await this.initializeAppListeners();
            }

            this.initialized = true;
            console.log('[CapacitorService] ✅ Initialization complete');
        } catch (error) {
            console.error('[CapacitorService] ❌ Initialization error:', error);
            // Não bloquear o app se houver erro na inicialização
            this.initialized = true;
        }
    }

    /**
     * Verifica se está rodando em plataforma nativa
     */
    isNativePlatform(): boolean {
        return this.platform === 'android' || this.platform === 'ios';
    }

    /**
     * Verifica se está rodando no Android
     */
    isAndroid(): boolean {
        return this.platform === 'android';
    }

    /**
     * Verifica se está rodando no iOS
     */
    isIOS(): boolean {
        return this.platform === 'ios';
    }

    /**
     * Inicializa a StatusBar
     */
    private async initializeStatusBar(): Promise<void> {
        try {
            if (!this.isNativePlatform()) return;

            // Configurar estilo baseado no tema do sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            await StatusBar.setStyle({
                style: prefersDark ? Style.Dark : Style.Light
            });

            // Configurar background da status bar para evitar sobreposição de conteúdo
            if (this.isAndroid()) {
                // Usar cor sólida que combina com o tema ao invés de transparente
                const backgroundColor = prefersDark ? '#0A0E13' : '#FFFFFF';
                await StatusBar.setBackgroundColor({ color: backgroundColor });
                // Desabilitar overlay para que o conteúdo não fique atrás da status bar
                await StatusBar.setOverlaysWebView({ overlay: false });
            }

            console.log('[CapacitorService] StatusBar configured');
        } catch (error) {
            console.error('[CapacitorService] StatusBar error:', error);
        }
    }

    /**
     * Inicializa o SplashScreen (configuração apenas, hide será feito depois)
     */
    private async initializeSplashScreen(): Promise<void> {
        try {
            if (!this.isNativePlatform()) return;

            // Apenas configurar, não esconder ainda
            // O hide será chamado depois que o app estiver completamente carregado
            console.log('[CapacitorService] SplashScreen configured (will hide after app ready)');
        } catch (error) {
            console.error('[CapacitorService] SplashScreen error:', error);
        }
    }

    /**
     * Esconde o SplashScreen
     * Chamado quando o app está completamente carregado
     */
    async hideSplashScreen(): Promise<void> {
        try {
            if (!this.isNativePlatform()) return;

            await SplashScreen.hide();
            console.log('[CapacitorService] SplashScreen hidden');
        } catch (error) {
            console.error('[CapacitorService] Error hiding SplashScreen:', error);
        }
    }

    /**
     * Inicializa LocalNotifications
     */
    private async initializeLocalNotifications(): Promise<void> {
        try {
            if (!this.isNativePlatform()) return;

            // Verificar se já tem permissão
            const permission = await LocalNotifications.checkPermissions();

            if (permission.display === 'granted') {
                console.log('[CapacitorService] LocalNotifications permission already granted');
            } else {
                console.log('[CapacitorService] LocalNotifications permission:', permission.display);
            }

            console.log('[CapacitorService] LocalNotifications configured');
        } catch (error) {
            console.error('[CapacitorService] LocalNotifications error:', error);
        }
    }

    /**
     * Inicializa PushNotifications
     */
    private async initializePushNotifications(): Promise<void> {
        try {
            if (!this.isNativePlatform()) return;

            // Registrar listeners
            await this.addPushListeners();

            // Verificar permissão atual
            const permission = await PushNotifications.checkPermissions();
            console.log('[CapacitorService] PushNotifications permission:', permission.receive);

            if (permission.receive === 'granted') {
                // Se já tiver permissão, registrar
                await PushNotifications.register();
            }

            console.log('[CapacitorService] PushNotifications configured');
        } catch (error) {
            console.error('[CapacitorService] PushNotifications error:', error);
        }
    }

    /**
     * Adiciona listeners para Push Notifications
     */
    private async addPushListeners(): Promise<void> {
        try {
            if (!this.isNativePlatform()) return;

            await PushNotifications.removeAllListeners();

            // Registro bem sucedido
            await PushNotifications.addListener('registration', token => {
                console.log('[CapacitorService] Push registration success, token:', token.value);
                // Aqui você enviaria o token para seu backend/Firebase se necessário
            });

            // Erro no registro
            await PushNotifications.addListener('registrationError', error => {
                console.error('[CapacitorService] Push registration error:', error);
            });

            // Notificação recebida com app aberto
            await PushNotifications.addListener('pushNotificationReceived', notification => {
                console.log('[CapacitorService] Push received:', notification);
                // Mostrar notificação local ou atualizar UI
            });

            // Ação na notificação (clique)
            await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
                console.log('[CapacitorService] Push action performed:', notification);
                // Navegar para tela específica
            });

        } catch (error) {
            console.error('[CapacitorService] Error adding push listeners:', error);
        }
    }

    /**
     * Solicita permissão para Push Notifications
     */
    async requestPushPermissions(): Promise<boolean> {
        try {
            if (!this.isNativePlatform()) {
                console.log('[CapacitorService] Not native platform, skipping push permission');
                return false;
            }

            const permission = await PushNotifications.requestPermissions();
            const granted = permission.receive === 'granted';

            if (granted) {
                await PushNotifications.register();
            }

            console.log('[CapacitorService] Push permission:', granted ? 'granted' : 'denied');
            return granted;
        } catch (error) {
            console.error('[CapacitorService] Error requesting push permission:', error);
            return false;
        }
    }

    /**
     * Solicita permissão para notificações locais
     */
    async requestNotificationPermission(): Promise<boolean> {
        try {
            if (!this.isNativePlatform()) {
                console.log('[CapacitorService] Not native platform, skipping notification permission');
                return false;
            }

            const permission = await LocalNotifications.requestPermissions();
            const granted = permission.display === 'granted';

            console.log('[CapacitorService] Notification permission:', granted ? 'granted' : 'denied');
            return granted;
        } catch (error) {
            console.error('[CapacitorService] Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Inicializa Haptics
     */
    private async initializeHaptics(): Promise<void> {
        try {
            if (!this.isNativePlatform()) return;

            // Testar se haptics está disponível - REMOVIDO para evitar vibração no boot
            // Apenas assumimos que está disponível ou falhará silenciosamente no uso
            console.log('[CapacitorService] Haptics initialized');
        } catch (error) {
            console.error('[CapacitorService] Haptics error:', error);
        }
    }

    /**
     * Fornece feedback háptico
     */
    async hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
        try {
            if (!this.isNativePlatform()) return;

            const impactStyle = style === 'light' ? ImpactStyle.Light :
                style === 'medium' ? ImpactStyle.Medium :
                    ImpactStyle.Heavy;

            await Haptics.impact({ style: impactStyle });
        } catch (error) {
            // Silenciar erros de haptics
        }
    }

    /**
     * Inicializa listeners de eventos do app
     */
    private async initializeAppListeners(): Promise<void> {
        try {
            if (!this.isNativePlatform()) return;

            // Listener para quando o app volta do background
            CapApp.addListener('appStateChange', ({ isActive }) => {
                console.log('[CapacitorService] App state changed:', isActive ? 'active' : 'background');

                if (isActive) {
                    // App voltou para foreground
                    this.onAppResume();
                } else {
                    // App foi para background
                    this.onAppPause();
                }
            });

            // Listener para quando o usuário pressiona o botão voltar (Android)
            CapApp.addListener('backButton', ({ canGoBack }) => {
                console.log('[CapacitorService] Back button pressed, canGoBack:', canGoBack);

                if (!canGoBack) {
                    // Se não pode voltar, minimizar o app ao invés de fechar
                    CapApp.minimizeApp();
                }
            });

            console.log('[CapacitorService] App listeners configured');
        } catch (error) {
            console.error('[CapacitorService] Error setting up app listeners:', error);
        }
    }

    /**
     * Callback quando o app volta do background
     */
    private onAppResume(): void {
        console.log('[CapacitorService] App resumed from background');

        // Disparar evento customizado para componentes que precisam reagir ao resume
        // NÃO emitir haptic feedback aqui - isso causava vibração indesejada
        try {
            window.dispatchEvent(new CustomEvent('app:resumed', {
                detail: { timestamp: Date.now() }
            }));
        } catch (error) {
            console.error('[CapacitorService] Error dispatching app:resumed event:', error);
        }
    }

    /**
     * Callback quando o app vai para background
     */
    private onAppPause(): void {
        console.log('[CapacitorService] App going to background');
        // Aqui poderia salvar estado, pausar tarefas, etc.
    }

    /**
     * Atualiza o tema da StatusBar
     */
    async updateStatusBarTheme(isDark: boolean): Promise<void> {
        try {
            if (!this.isNativePlatform()) return;

            await StatusBar.setStyle({
                style: isDark ? Style.Dark : Style.Light
            });

            // Atualizar cor de fundo da status bar junto com o tema
            if (this.isAndroid()) {
                const backgroundColor = isDark ? '#0A0E13' : '#FFFFFF';
                await StatusBar.setBackgroundColor({ color: backgroundColor });
            }

            console.log('[CapacitorService] StatusBar theme updated:', isDark ? 'dark' : 'light');
        } catch (error) {
            console.error('[CapacitorService] Error updating StatusBar theme:', error);
        }
    }

    /**
     * Obtém informações do dispositivo
     */
    getDeviceInfo() {
        return {
            platform: this.platform,
            isNative: this.isNativePlatform(),
            isAndroid: this.isAndroid(),
            isIOS: this.isIOS(),
            isWeb: this.platform === 'web'
        };
    }
}

// Exportar singleton
export const capacitorService = new CapacitorService();
