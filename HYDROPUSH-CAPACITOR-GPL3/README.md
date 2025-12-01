# 📘 Manual Técnico - Hydropush App

Bem-vindo ao manual técnico do **Hydropush**, um aplicativo de monitoramento de hidratação desenvolvido com tecnologias web modernas e adaptado para dispositivos móveis.

Este documento serve como guia para professores e avaliadores entenderem a arquitetura do projeto, como configurar o ambiente e como compilar o aplicativo.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído sobre uma pilha tecnológica robusta e moderna:

*   **Linguagem**: [TypeScript](https://www.typescriptlang.org/) (JavaScript tipado para maior segurança).
*   **Frontend**: [React](https://react.dev/) (Biblioteca para construção de interfaces).
*   **Build Tool**: [Vite](https://vitejs.dev/) (Ferramenta de build extremamente rápida).
*   **Mobile Runtime**: [Capacitor](https://capacitorjs.com/) (Ponte para transformar o app web em nativo Android/iOS).
*   **Estilização**: [Tailwind CSS](https://tailwindcss.com/) (Framework de CSS utilitário) + CSS Modules.
*   **Gerenciamento de Estado**: React Context API + Hooks personalizados.

---

## 📂 Estrutura do Código

O código fonte está organizado dentro da pasta `src/` seguindo uma arquitetura baseada em **Features** (Funcionalidades) e **Core** (Núcleo), facilitando a manutenção e escalabilidade.

### 1. `src/features/` (Módulos Funcionais)
Aqui reside a lógica específica de cada parte do aplicativo. Cada pasta representa uma funcionalidade isolada:
*   **`auth/`**: Telas e lógica de autenticação/login.
*   **`dashboard/`**: Painel principal com resumo do dia.
*   **`profile/`**: Gerenciamento de perfil do usuário, nível e conquistas.
*   **`stats/`**: Visualização de gráficos e estatísticas de consumo.
*   **`history/`**: Histórico detalhado de registros.
*   **`onboarding/`**: Fluxo de introdução para novos usuários.

### 2. `src/core/` (Núcleo do Sistema)
Contém a lógica de negócios pura e definições que sustentam o app:
*   **`services/`**: Serviços que gerenciam dados (ex: `NotificationService`, `StorageService`).
*   **`models/`**: Definições de tipos e interfaces de dados (ex: `User`, `WaterLog`).
*   **`config/`**: Configurações globais do aplicativo.

### 3. `src/shared/` (Compartilhado)
Recursos reutilizáveis em todo o projeto:
*   **`components/`**: Biblioteca de componentes visuais (Botões, Cards, Inputs).
*   **`hooks/`**: Hooks personalizados do React (ex: `useToast`, `useTheme`).
*   **`layouts/`**: Estruturas de página padrão (ex: Layout com barra de navegação).

---

## 🚀 Como Executar o Projeto

## 📋 Requisitos do Sistema e Ambiente

Para garantir que o projeto execute sem problemas, é necessário preparar o ambiente de desenvolvimento com as ferramentas abaixo.

### 1. Softwares Essenciais

*   **Node.js** (Versão 18 LTS ou superior)
    *   *Função*: Ambiente de execução para o código JavaScript/TypeScript e gerenciamento de pacotes.
    *   *Download*: [nodejs.org](https://nodejs.org/)
    *   *Verificação*: No terminal, digite `node -v` e `npm -v`.

*   **Java Development Kit (JDK)** (Versão 17)
    *   *Função*: Necessário para compilar o código Android (Gradle). O Android Studio geralmente gerencia isso, mas ter o JDK 17 instalado no sistema evita erros de compatibilidade.
    *   *Download*: [Adoptium (Temurin 17)](https://adoptium.net/)
    *   *Verificação*: `java -version`.

*   **Git**
    *   *Função*: Controle de versão para baixar e gerenciar o código.
    *   *Download*: [git-scm.com](https://git-scm.com/)

### 2. Para Desenvolvimento Mobile (Android)

Se o objetivo é gerar o aplicativo nativo (`.apk`) ou rodar em emuladores, você precisará do **Android Studio**.

*   **Android Studio** (Versão Koala ou mais recente)
    *   *Download*: [developer.android.com/studio](https://developer.android.com/studio)
    *   **Componentes Necessários** (Instalados via SDK Manager dentro do Android Studio):
        *   *Android SDK Build-Tools* (Recomendado: 34.0.0 ou superior)
        *   *Android SDK Platform-Tools*
        *   *Android Emulator* (Para rodar o app no PC)
    *   **Configuração de Variáveis de Ambiente**:
        *   Defina a variável `ANDROID_HOME` apontando para a pasta do SDK.
        *   Defina a variável `JAVA_HOME` apontando para a pasta do JDK 17.

### 3. Editor de Código Recomendado

*   **Visual Studio Code (VS Code)**
    *   *Extensões Úteis*:
        *   *ESLint* (Para padronização de código).
        *   *Prettier* (Para formatação automática).
        *   *Tailwind CSS IntelliSense* (Para autocompletar classes de estilo).

---

## 🚀 Como Executar o Projeto

### Passo 1: Instalação das Dependências
Abra o terminal na raiz do projeto e execute:

```bash
npm install
```

### Passo 2: Executar em Modo Web (Desenvolvimento)
Para testar o aplicativo rapidamente no navegador:

```bash
npm run dev
```
O aplicativo geralmente estará disponível em: `http://localhost:5173`

---

## 📱 Como Gerar o Build (Android)

Para transformar o código web em um aplicativo Android nativo, siga os passos abaixo:

### 1. Gerar o Build Web
Primeiro, compilamos o React para arquivos estáticos (HTML/CSS/JS) na pasta `dist/` ou `build/`:

```bash
npm run build
```

### 2. Sincronizar com o Capacitor
Este comando copia os arquivos compilados para dentro da pasta do projeto Android (`android/`):

```bash
npx cap sync
```

### 3. Abrir no Android Studio
Para compilar o APK final ou rodar em um emulador:

```bash
npx cap open android
```
Isso abrirá o Android Studio. Lá, aguarde a indexação e clique no botão **"Run" (Play)** ▶️ para instalar o app no emulador ou dispositivo conectado.

### 4. Compilar APK via Terminal (Alternativa)
Se preferir gerar o arquivo `.apk` diretamente pelo terminal, sem abrir o Android Studio:

```bash
# Entre na pasta do projeto nativo
cd android

# Dê permissão de execução ao script (se necessário, no Linux/Mac)
chmod +x gradlew

# Execute o comando de build
./gradlew assembleDebug
```

Após o término, o arquivo **APK** estará disponível em:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🧪 Scripts Disponíveis

No arquivo `package.json`, você encontrará os seguintes scripts úteis:

*   `npm run dev`: Inicia o servidor de desenvolvimento.
*   `npm run build`: Cria a versão de produção do app web.
*   `npm run lint`: Verifica o código em busca de erros de estilo/sintaxe.
*   `npm run cap:sync`: Atalho para sincronizar as mudanças com o projeto nativo.

---

## 📝 Notas para Avaliação

*   **Persistência de Dados**: O aplicativo utiliza armazenamento local (SQLite/LocalStorage) para salvar o progresso do usuário, garantindo funcionamento offline.
*   **Interface**: A UI foi desenhada com princípios de *Glassmorphism* e responsividade para se adaptar a diferentes tamanhos de tela.
*   **Notificações**: O sistema de notificações locais foi implementado para lembretes de hidratação (funcionalidade nativa).

---
*Desenvolvido pela equipe Hydropush.*
