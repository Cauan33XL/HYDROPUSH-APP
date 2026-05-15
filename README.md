# 💧 Hydropush APP

<div align="center">

![License](https://img.shields.io/badge/license-GPLv3-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![Capacitor](https://img.shields.io/badge/Capacitor-7-119EFF?logo=capacitor)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)

**Aplicativo mobile de controle de hidratação diária — Offline-First, com suporte a Android.**

</div>

---

## 📖 Sobre o Projeto

O **Hydropush** é um aplicativo para monitoramento de hidratação desenvolvido com uma stack moderna de tecnologias web. Ele foi projetado para funcionar completamente offline, com notificações locais, temas claro/escuro e persistência de dados no dispositivo — sem nenhum dado enviado para servidores externos.

### ✨ Funcionalidades Principais

- 💧 **Registro de consumo** de água em tempo real
- 📊 **Gráficos e estatísticas** de hidratação diária e histórica
- 🎯 **Meta personalizada** calculada com base no perfil do usuário (peso × 35ml/kg)
- 🔔 **Notificações locais** com lembretes configuráveis
- 🌙 **Temas Claro e Escuro** com troca em tempo real
- 🔒 **100% Offline-First** — dados salvos localmente no dispositivo via SQLite/LocalStorage
- 🏆 **Sistema de conquistas** e progressão de nível
- 📱 **Design responsivo** com estética Glassmorphism

---

## 📂 Estrutura do Repositório

Este é um **monorepo com npm workspaces** organizado em dois módulos:

```text
HYDROPUSH-APP/
├── hydropush-react/          # 🌐 Aplicação Web (React + Vite)
│   ├── src/
│   │   ├── features/         # Módulos funcionais
│   │   │   ├── auth/         # Onboarding e configuração inicial
│   │   │   ├── dashboard/    # Painel principal
│   │   │   ├── history/      # Histórico de registros
│   │   │   ├── onboarding/   # Fluxo de boas-vindas
│   │   │   ├── profile/      # Perfil, conquistas e nível
│   │   │   └── stats/        # Gráficos e estatísticas
│   │   ├── core/
│   │   │   └── services/     # Lógica de negócio e acesso a dados
│   │   └── shared/           # Componentes e hooks reutilizáveis
│   ├── index.html
│   ├── vite.config.ts        # ← Configuração principal do Vite (na raiz)
│   └── package.json
│
├── hydropush-capacitor/      # 📱 Wrapper Mobile (Capacitor + Android)
│   ├── android/              # Projeto nativo Android
│   ├── assets/               # Ícones e splash screens
│   ├── capacitor.config.ts
│   └── package.json
│
├── vite.config.ts            # Configuração Vite raiz (aponta para hydropush-react)
├── tsconfig.json             # TypeScript raiz
├── eslint.config.js          # ESLint (Flat Config)
├── tailwind.config.js        # Tailwind CSS
├── package.json              # Orquestrador de workspaces
└── LICENSE                   # GNU GPL v3
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Versão |
| :--- | :--- | :--- |
| **Linguagem** | TypeScript | 5.7 |
| **UI Framework** | React | 18.3 |
| **Build Tool** | Vite | 7.x |
| **Estilização** | Tailwind CSS | 4.x |
| **Componentes** | Radix UI + shadcn/ui | — |
| **Animações** | Motion (Framer Motion) | — |
| **Gráficos** | Recharts | 2.x |
| **Mobile Runtime** | Capacitor | 7.x |
| **Persistência** | SQLite / LocalStorage | — |
| **Notificações** | Capacitor Local Notifications | — |
| **Linting** | ESLint (Flat Config) | 9.x |

---

## 🚀 Começando

### Pré-requisitos

- **Node.js** 18 LTS ou superior
- **Git**
- *(Para Android)* **Android Studio** com SDK 34+ e **JDK 17**

### 1. Instalar Dependências

```bash
# Na raiz do repositório (instala todos os workspaces)
npm install
```

### 2. Desenvolvimento Web

```bash
npm run dev
```

Acesse em: `http://localhost:5173`

### 3. Lint

```bash
npm run lint
```

---

## 📱 Build para Android

### Build Completo (Web + Sync + Abrir Android Studio)

```bash
npm run android
```

### Ou passo a passo:

```bash
# 1. Gerar o build de produção da aplicação web
npm run build

# 2. Sincronizar com o projeto Android
npm run cap:sync

# 3. Abrir no Android Studio para compilar o APK
npm run cap:open
```

### Gerar APK via Terminal

```bash
cd hydropush-capacitor/android
chmod +x gradlew
./gradlew assembleDebug
```

O APK estará disponível em:
`hydropush-capacitor/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📜 Scripts Disponíveis

| Script | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento Vite |
| `npm run build` | Gera o build de produção em `/build` |
| `npm run lint` | Executa o ESLint em todo o projeto |
| `npm run cap:sync` | Sincroniza o build com o projeto Android |
| `npm run cap:open` | Abre o projeto no Android Studio |
| `npm run android` | Build completo + Sync + Android Studio |

---

## 🏗️ Arquitetura

A aplicação segue uma arquitetura modular baseada em **Features** com uma camada de **Core** isolada:

- **`features/`** — Cada funcionalidade (dashboard, perfil, histórico...) é um módulo independente com suas próprias telas e lógica local.
- **`core/services/`** — Serviços globais de negócio (`StorageService`, `NotificationService`, `CapacitorService`, `CriticalFlagsService`) que abstraem o acesso a dados e APIs nativas.
- **`shared/`** — Componentes UI, hooks e layouts reutilizáveis em toda a aplicação.

---

## 📄 Licença

Este projeto é licenciado sob a **GNU General Public License v3.0 (GPLv3)**.
Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.

Copyright © 2026 Cauan Gabriel Matos Silva (Cauan33XL) & Equipe Hydropush.
