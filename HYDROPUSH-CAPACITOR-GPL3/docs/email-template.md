# 📧 Template de Email - Hydropush

Este documento contém o template HTML configurado no EmailJS para os lembretes de hidratação.

## Informações de Configuração

- **Service ID**: `default_service`
- **Template ID**: `template_5xvb1sh`
- **Public Key**: `skes2kcAs-Hxy-ByR`

## Variáveis do Template

O template utiliza as seguintes variáveis que devem ser enviadas via `templateParams`:

- `{{name}}` - Nome do usuário
- `${link_confirmacao}` - Link para confirmar que o usuário bebeu água
- `{{email}}` - Email do destinatário (usado pelo EmailJS automaticamente)

## Template HTML

```html
<div style="font-family: Arial, sans-serif; color: #222; padding: 20px;">
  <h2 style="text-align:center; margin-bottom: 10px;">💧 Hora da Hidratação, Olhe seu Hydropush!</h2>

  <p style="font-size: 16px; line-height: 1.5;">
    Ei <strong>{{name}}</strong>, seu corpo tá te chamando igual um alarme silencioso:
    <br><br>
    <strong>🚨 Bebe água agora.</strong><br>
    Sim, agora mesmo. Antes que vire um cacto existencial andando por aí.
  </p>

  <p style="font-size: 15px; line-height: 1.5;">
    Lembre-se: quem domina a água, domina o próprio ciclo — e mantém a
    mente afiada como um hacker místico no deserto.
  </p>

  <div style="text-align:center; margin: 25px 0;">
    <a href="${link_confirmacao}" 
       style="background:#008CFF; color:white; padding:12px 20px; 
       border-radius:8px; text-decoration:none; font-size:16px;">
      ✔️ Já bebi
    </a>
  </div>

  <p style="font-size: 13px; text-align:center; color:#666;">
    Hydropush — mantendo você menos seco que o Saara desde sempre.
  </p>
</div>
```

## Uso no Código

O serviço de email (`emailNotificationService.ts`) envia os emails com os seguintes parâmetros:

```typescript
const templateParams = {
    name: name,
    link_confirmacao: `${window.location.origin}/confirm-hydration`,
    email: settings.reminderEmail
};

await emailjs.send(
    EMAILJS_CONFIG.SERVICE_ID,
    EMAILJS_CONFIG.TEMPLATE_ID,
    templateParams
);
```

## Configuração no EmailJS

Para configurar este template no EmailJS:

1. Acesse [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Vá para "Email Templates"
3. Crie/edite o template com ID `template_5xvb1sh`
4. Cole o HTML acima no editor de template
5. Configure as variáveis: `{{name}}`, `${link_confirmacao}`, `{{email}}`
6. Teste o envio usando o botão "Test it"

## Notas

- O link de confirmação aponta para `/confirm-hydration` - você pode precisar implementar essa rota no futuro
- O template usa HTML inline CSS para garantir compatibilidade com clientes de email
- As cores e estilos podem ser personalizados diretamente no Dashboard do EmailJS
