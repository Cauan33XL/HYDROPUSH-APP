import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// Configuração do Firebase a partir de variáveis de ambiente
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validar configuração
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('[Firebase] ❌ ERRO: Configuração do Firebase não encontrada!');
    console.error('[Firebase] 💡 Configure as variáveis de ambiente VITE_FIREBASE_* no arquivo .env');
    console.error('[Firebase] 📖 Consulte .env.example para ver as variáveis necessárias');
    throw new Error('Firebase configuration missing. Please check your .env file.');
}

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// Log de inicialização (SEM expor credenciais)
console.log('[Firebase] ✅ Initialized successfully');
console.log('[Firebase] 📦 Project:', firebaseConfig.projectId);
console.log('[Firebase] 🌍 Environment:', import.meta.env.MODE);
