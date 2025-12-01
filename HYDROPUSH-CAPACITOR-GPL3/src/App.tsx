import React, { useState, useEffect, Suspense, lazy } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { storageService } from './core/services/StorageService';
import { capacitorService } from './core/services/CapacitorService';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { LoadingSpinner } from './shared/components/LoadingStates';

// Lazy load heavy components
const AuthFlow = lazy(() => import('./features/auth/AuthFlow').then(m => ({ default: m.AuthFlow })));
const RootLiquidGlassWrapper = lazy(() => import('./shared/layouts/RootLiquidGlassWrapper').then(m => ({ default: m.RootLiquidGlassWrapper })));

export default function App() {
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [isCapacitorReady, setIsCapacitorReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      console.log('[App] Starting initialization...');

      try {
        // 1. Inicializar Storage Service
        console.log('[App] Initializing Storage Service...');
        await storageService.init();
        console.log('[App] ✅ Storage Service initialized');
        setIsStorageReady(true);

        // 2. Inicializar Capacitor Service (plugins nativos)
        console.log('[App] Initializing Capacitor Service...');
        await capacitorService.initialize();
        console.log('[App] ✅ Capacitor Service initialized');
        setIsCapacitorReady(true);

      } catch (error) {
        console.error('[App] ❌ Initialization error:', error);
        // Importante: Setamos como true mesmo com erro para o app não travar no loading infinito
        setIsStorageReady(true);
        setIsCapacitorReady(true);
      }
    };

    initializeApp();
  }, []);

  // 3. Esconder SplashScreen quando tudo estiver pronto
  useEffect(() => {
    const isReady = isStorageReady && isCapacitorReady;

    if (isReady) {
      const hideSplash = async () => {
        console.log('[App] All systems ready, hiding SplashScreen...');
        await capacitorService.hideSplashScreen();
        console.log('[App] 🚀 App ready!');
      };

      // Dar um pequeno delay para garantir que a UI está renderizada
      setTimeout(() => {
        hideSplash();
      }, 300);
    }
  }, [isStorageReady, isCapacitorReady]);

  // Mostrar loading enquanto não estiver pronto
  if (!isStorageReady || !isCapacitorReady) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0A0E13',
        color: '#fff'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(30, 136, 229, 0.2)',
          borderTopColor: '#1E88E5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }} />
        <p>Carregando Hydropush...</p>
        <style>{
          `@keyframes spin { to { transform: rotate(360deg); } }`
        }</style>
      </div>
    );
  }

  return (
    <ErrorBoundary onReset={() => window.location.reload()}>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <RootLiquidGlassWrapper>
              <AuthFlow />
            </RootLiquidGlassWrapper>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
