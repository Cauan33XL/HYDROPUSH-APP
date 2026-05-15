# Configuração do Sistema de Notificações - Hydropush

Este guia fornece instruções completas para configurar e usar o sistema de notificações push e email do Hydropush.

## Índice

1. [Configuração do EmailJS](#configuração-do-emailjs)
2. [Configuração de Notificações Push](#configuração-de-notificações-push)
3. [Como Testar Localmente](#como-testar-localmente)
4. [Troubleshooting](#troubleshooting)
5. [Boas Práticas](#boas-práticas)

---

## Configuração do EmailJS

O Hydropush usa [EmailJS](https://www.emailjs.com/) para enviar notificações por email.

### 1. Criar Conta no EmailJS

1. Acesse [emailjs.com](https://www.emailjs.com/) e crie uma conta gratuita
2. Confirme seu email

### 2. Configurar Serviço de Email

1. No dashboard do EmailJS, vá em **Email Services**
2. Clique em **Add New Service**
3. Escolha seu provedor de email (Gmail, Outlook, etc.)
4. Siga as instruções específicas do provedor:
   
   **Para Gmail:**
   - Ative a autenticação de dois fatores na sua conta Google
   - Gere uma "App Password" em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Use essa senha no EmailJS

5. Anote o **Service ID** (ex: `service_abc123`)

### 3. Criar Template de Email

1. Vá em **Email Templates**
2. Clique em **Create New Template**
3. Use o seguinte template HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>{{subject}}</title>
</head>
<body>
  <p>Olá {{to_name}},</p>
  
  {{{html_content}}}
  
  <p>{{{message}}}</p>
  
  <p>Atenciosamente,<br>Equipe Hydropush</p>
</body>
</html>
```

4. Configure as variáveis:
   - `to_name` - Nome do destinatário
   - `to_email` - Email do destinatário
   - `subject` - Assunto do email
   - `message` - Mensagem em texto
   - `html_content` - Conteúdo HTML (para templates customizados)

5. Na aba **Settings**, configure:
   - **To Email**: `{{to_email}}`
   - **Subject**: `{{subject}}`
   - **From Name**: Hydropush
   - **Reply To**: seu-email@exemplo.com

6. Clique em **Save** e anote o **Template ID** (ex: `template_xyz789`)

### 4. Obter Public Key

1. No dashboard, vá em **Account** → **General**
2. Copie sua **Public Key** (ex: `skes2kcAs-Hxy-ByR`)

### 5. Configurar no Código

Abra o arquivo `src/constants/emailConfig.ts` e atualize com suas credenciais:

```typescript
export const EMAILJS_CONFIG = {
    SERVICE_ID: 'seu_service_id',      // Cole aqui o Service ID
    TEMPLATE_ID: 'seu_template_id',    // Cole aqui o Template ID
    PUBLIC_KEY: 'sua_public_key',      // Cole aqui sua Public Key
};
```

> **⚠️ IMPORTANTE**: Nunca compartilhe essas credenciais publicamente ou faça commit delas em repositórios públicos!

---

## Configuração de Notificações Push

### Web (Navegador)

As notificações funcionam automaticamente em navegadores modernos que suportam a API de Notificações:

1. Ao acessar a aplicação, clique em "Ativar Notificações"
2. Permita as notificações quando o navegador solicitar
3. Pronto! Você receberá notificações push

**Navegadores Suportados:**
- Chrome 50+
- Firefox 44+
- Safari 16+ (macOS 13+)
- Edge 14+

### Android

As configurações já estão prontas no `AndroidManifest.xml`:

```xml
<!-- Permissões necessárias -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

**Para testar no Android:**

1. Execute o build:
   ```bash
   npm run build
   npx cap sync android
   ```

2. Abra o projeto no Android Studio:
   ```bash
   npx cap open android
   ```

3. Execute o app em um dispositivo físico ou emulador

4. Conceda as permissões de notificação quando solicitado

5. As notificações agendadas funcionarão mesmo com o app fechado!

### iOS (Futuro)

> Configuração do iOS será adicionada em versões futuras. As notificações web já funcionam no Safari 16+ em iOS 16.4+.

---

## Como Testar Localmente

### 1. Teste Rápido na Interface

1. Execute o projeto:
   ```bash
   npm run dev
   ```

2. Abra a aplicação no navegador

3. Navegue para **Configurações** → **Notificações**

4. Ative as notificações push e conceda permissões

5. Configure seu email para receber lembretes

6. Use os botões de teste:
   - **Testar Push**: Envia notificação push imediatamente
   - **Testar Email**: Envia email de teste para o endereço configurado

7. Verifique o **Histórico** para ver notificações enviadas

### 2. Teste de Notificação Push

```javascript
// No console do navegador:
await notificationService.showNotification({
  title: 'Teste Manual',
  body: 'Esta é uma notificação de teste',
  icon: '/favicon.ico'
});
```

### 3. Teste de Email

```javascript
// No console do navegador:
const results = await unifiedNotificationService.testNotifications();
console.log('Resultados:', results);
```

### 4. Verificar Logs Estruturados

Abra o console do navegador (F12) e você verá logs coloridos:

- 🔵 **INFO** - Operações normais
- 🟡 **WARN** - Avisos (ex: rate limiting)
- 🔴 **ERROR** - Erros (ex: falha ao enviar)
- ⚪ **DEBUG** - Detalhes de debugging

---

## Troubleshooting

### Email não está sendo enviado

**Sintomas**: "Email de teste enviado!" mas nada chega na caixa de entrada.

**Soluções**:

1. **Verifique as credenciais do EmailJS**:
   - Service ID correto?
   - Template ID correto?
   - Public Key correta?

2. **Verifique spam/lixo eletrônico**:
   - Emails podem cair na pasta de spam inicialmente

3. **Verifique o console**:
   - Abra F12 e procure por erros em vermelho
   - Mensagens de rate limiting?

4. **Teste no dashboard do EmailJS**:
   - Vá em Test Email no dashboard
   - Se não funcionar lá, o problema é na configuração do service

5. **Limite de emails**:
   - Conta gratuita: 200 emails/mês
   - Verifique se não atingiu o limite

### Notificações Push não aparecem

**Sintomas**: Click em "Testar Push" mas nada acontece.

**Soluções**:

1. **Verifique permissões**:
   - Status deve ser "Permitidas" (verde)
   - Se bloqueadas, clique em "Ajustar"

2. **Navegador**:
   - Chrome: Vá em Configurações → Privacidade e segurança → Configurações do site → Notificações
   - Firefox: Clique no ícone do cadeado → Permissões
   - Safari: Safari → Preferências → Websites → Notificações

3. **Modo Não Perturbe (Android/Desktop)**:
   - Verifique se o dispositivo não está em modo silencioso

4. **Notificações do sistema desativadas**:
   - Windows: Configurações → Sistema → Notificações
   - macOS: Preferências do Sistema → Notificações

### Rate Limiting

**Sintomas**: "Muitos emails enviados. Aguarde X minutos."

**Explicação**: O sistema limita a 10 emails por hora por endereço para evitar spam.

**Solução**: Aguarde o tempo indicado ou use endereço diferente para testes.

### Permissão negada automaticamente

**Sintomas**: Não aparece o pop-up de permissão.

**Solução**:
1. O navegador bloqueou automaticamente
2. Limpe as permissões do site:
   - Chrome: chrome://settings/content/notifications
   - Firefox: about:preferences#privacy → Permissões
3. Recarregue a página e tente novamente

---

## Boas Práticas

### 1. Frequência de Notificações

- ✅ **Recomendado**: A cada 2-3 horas durante o dia
- ❌ **Evite**: Mais de 1 notificação por hora

### 2. Horário de Silêncio

Configure horários de silêncio para não incomodar usuários:
- Padrão: 22h - 7h
- Ajustável nas configurações

### 3. Conteúdo das Notificações

- **Título**: Claro e objetivo (máx. 40 caracteres)
- **Corpo**: Mensagem amigável e motivadora (máx. 100 caracteres)
- **Emoji**: Use para chamar atenção (💧 🏆 📊)

### 4. Templates de Email

Use templates HTML para emails mais bonitos:

```typescript
await emailNotificationService.sendEmail({
  to: 'usuario@exemplo.com',
  subject: 'Lembrete de Hidratação',
  body: 'Hora de beber água!',
  name: 'João',
  templateId: 'hydration_reminder',
  variables: {
    currentIntake: '1500',
    goalIntake: '2000'
  }
});
```

### 5. Monitoramento

Verifique regularmente:
- Histórico de notificações (no app)
- Logs do console (para debugging)
- Taxa de entrega de emails (dashboard EmailJS)

### 6. Privacidade

- Nunca armazene emails em plain text em logs públicos
- Use HTTPS sempre
- Informe usuários sobre coleta de email

### 7. Testes

Antes de lançar:
- ✅ Teste push em Chrome, Firefox e Safari
- ✅ Teste email em Gmail, Outlook e outros
- ✅ Teste em dispositivo Android físico
- ✅ Verifique notificações após reinicializar dispositivo
- ✅ Teste rate limiting
- ✅ Teste fallback (push → email)

---

## Recursos Avançados

### Sistema Unificado

Use `UnifiedNotificationService` para coordenar push e email:

```typescript
// Envia push E email automaticamente
await unifiedNotificationService.sendHydrationReminder();

// Envia push, fallback para email se falhar
await unifiedNotificationService.sendNotification({
  title: 'Título',
  body: 'Mensagem',
  sendPush: true,
  sendEmail: true,
  fallbackToEmail: true
});
```

### Histórico Combinado

```typescript
// Obtém últimas 10 notificações (push + email)
const history = unifiedNotificationService.getCombinedHistory(10);
```

### Logs Estruturados

```typescript
import { notificationLogger } from './core/services/NotificationLogger';

// Exportar logs para debugging
const logsJSON = notificationLogger.exportLogsAsJSON();
console.log(logsJSON);

// Limpar logs antigos
notificationLogger.clearLogs();
```

---

## Suporte

Se encontrar problemas:

1. Verifique o console do navegador (F12)
2. Revise este guia de troubleshooting
3. Consulte a documentação do EmailJS: https://www.emailjs.com/docs/
4. Verifique os logs estruturados no app

---

**Última atualização**: 2025-11-20
**Versão do Hydropush**: 0.1.0
