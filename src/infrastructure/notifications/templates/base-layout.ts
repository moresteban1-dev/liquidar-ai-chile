// src/infrastructure/notifications/templates/base-layout.ts

export function getBaseLayout(): string {
  return `<!DOCTYPE html>
<html lang="es" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>{{SUBJECT}}</title>
  <style>
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; padding: 16px !important; }
      .content { padding: 20px !important; }
      .header { padding: 16px 20px !important; }
      .cta-button { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#050505;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
          {{CONTENT}}
          <tr>
            <td style="padding:16px 32px;background-color:#080808;border-top:1px solid rgba(255,255,255,0.04);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#555;font-size:12px;line-height:18px;">
                    <p style="margin:0;">Liquidar.cl Platform &copy; {{YEAR}}</p>
                    <p style="margin:4px 0 0;">Este email fue enviado automáticamente. No respondas directamente.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
