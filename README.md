# 💧 Hydropush APP

![License](https://img.shields.io/badge/license-GPLv3-blue.svg) ![Status](https://img.shields.io/badge/status-active-success.svg)

Hydropush é um aplicativo para controle de hidratação diária, desenvolvido com tecnologias web modernas. O sistema é totalmente offline, oferecendo suporte a temas claro e escuro, lembretes personalizados e persistência de dados local.

---

## 📂 Estrutura do Projeto

Este repositório está organizado em dois módulos principais:

*   **[hydropush-react](./hydropush-react)**: Contém o código-fonte da aplicação Web (React + Vite + Tailwind CSS).
*   **[hydropush-capacitor](./hydropush-capacitor)**: Contém a configuração do Capacitor e os ativos para a versão mobile (Android).

---

## 🛠️ Tecnologias Utilizadas

*   **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
*   **Frontend**: [React](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Mobile Runtime**: [Capacitor](https://capacitorjs.com/)
*   **Estilização**: [Tailwind CSS](https://tailwindcss.com/)

---

## 🚀 Como Executar o Projeto

### 1. Instalação das Dependências
Abra o terminal na raiz do projeto e execute:
```bash
npm install
```

### 2. Executar em Modo Web (Desenvolvimento)
```bash
npm run dev
```
O aplicativo geralmente estará disponível em: `http://localhost:5173`

### 3. Sincronizar com o Capacitor (Android)
```bash
# Gere o build web primeiro
npm run build

# Sincronize com o projeto mobile
npm run cap:sync
```

Para abrir o projeto no Android Studio:
```bash
npx cap open android
```

---

## 📄 Licença

Este projeto é licenciado sob a licença **GNU General Public License v3.0 (GPLv3)**.
Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.

Copyright (C) 2025 Cauan Gabriel Matos Silva (Cauan33XL) & Equipe Hydropush.
