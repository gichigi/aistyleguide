// This is a mock email service for demonstration purposes
// In a real application, you would use a service like SendGrid, Mailgun, etc.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailTemplate = "purchase-confirmation" | "implementation-tips"

export interface EmailOptions {
  to: string
  subject?: string
  template: EmailTemplate
  variables?: Record<string, any>
}

export interface ScheduledEmailOptions extends EmailOptions {
  delay: string // e.g., '24h', '2d'
}

export interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  react?: React.ReactElement;
}

export interface ThankYouEmailData {
  customerEmail: string;
  customerName?: string;
  sessionId: string;
  amount: number;
  currency: string;
}

export interface AbandonedCartEmailData {
  customerEmail: string;
  customerName?: string;
  recoveryUrl: string;
  discountCode?: string;
  expiresAt: number;
}

/**
 * Send an email using the specified template and variables
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log(`Sending email to ${options.to} using template ${options.template}`)
  console.log("Variables:", options.variables)

  // In a real implementation, this would call your email service API
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Email sent to ${options.to}`)
      resolve(true)
    }, 500)
  })
}

/**
 * Schedule an email to be sent after a delay
 */
export async function scheduleEmail(options: ScheduledEmailOptions): Promise<boolean> {
  console.log(`Scheduling email to ${options.to} with delay ${options.delay}`)

  // In a real implementation, this would use a task queue or scheduling service
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Email scheduled for ${options.to}`)
      resolve(true)
    }, 500)
  })
}

/**
 * Generate a secure access token for email links
 */
export function generateSecureToken(): string {
  // In a real implementation, this would generate a cryptographically secure token
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Send a purchase confirmation email with access links
 */
export async function sendPurchaseConfirmationEmail(email: string, accessToken: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Your Style Guide is Ready!",
    template: "purchase-confirmation",
    variables: {
      accessLink: `https://styleguideai.com/preview?token=${accessToken}`,
      downloadLinks: {
        pdf: `https://styleguideai.com/download/pdf?token=${accessToken}`,
        markdown: `https://styleguideai.com/download/md?token=${accessToken}`,
        docx: `https://styleguideai.com/download/docx?token=${accessToken}`,
        html: `https://styleguideai.com/download/html?token=${accessToken}`,
      },
    },
  })
}

class EmailService {
  async sendEmail(data: EmailData) {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.log('⚠️ RESEND_API_KEY not set - email not sent:', data.subject);
        return { success: false, error: 'No API key configured' };
      }

      const result = await resend.emails.send({
        from: 'Tahi from AIStyleGuide <support@aistyleguide.com>',
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
        react: data.react,
      });

      console.log('✅ Email sent successfully:', result.data?.id);
      return { success: true, id: result.data?.id };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendThankYouEmail(data: ThankYouEmailData) {
    const subject = 'Thank you for downloading AI Style Guide!';
    const html = this.generateThankYouEmailHTML(data);
    const text = this.generateThankYouEmailText(data);

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
      text,
    });
  }

  async sendAbandonedCartEmail(data: AbandonedCartEmailData) {
    const subject = '💡 Complete Your Style Guide - 20% Off Inside!';
    const html = this.generateAbandonedCartEmailHTML(data);
    const text = this.generateAbandonedCartEmailText(data);

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
      text,
    });
  }

  private generateThankYouEmailHTML(data: ThankYouEmailData): string {
    const firstName = data.customerName ? data.customerName.split(' ')[0] : 'there';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank you for downloading AI Style Guide!</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <p style="margin-bottom: 20px;">Hey ${firstName},</p>
          
          <p style="margin-bottom: 15px;">I'm Tahi — I built AI Style Guide because I kept wasting hours piecing together brand-voice docs for clients.</p>
          
          <p style="margin-bottom: 15px;">Seeing your order come through today honestly made my week. 🙌</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 15px 0; font-weight: 500;">If you have 2 minutes:</p>
            <ol style="margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">What problem were you hoping AI Style Guide would solve?</li>
              <li style="margin-bottom: 8px;">What nearly stopped you from buying?</li>
              <li style="margin-bottom: 0;">Anything else you wanna share :)</li>
            </ol>
          </div>
          
          <p style="margin-bottom: 15px;">And if you've got questions about AIStyleGuide, here's my direct Calendly link (15 min, no pitch):</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://calendly.com/l-gichigi/customer-chat" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              📅 Chat with Tahi (15 min)
            </a>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/full-access?session_id=${data.sessionId}" 
               style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Access Your Style Guide
            </a>
          </div>
          
          <p style="margin-bottom: 15px;">Thanks again for being one of our very first customers. Anything you need, just hit reply — it's really me on the other end.</p>
          
          <p style="margin-bottom: 5px;">Cheers,<br>
          Tahi<br>
          Founder, AI Style Guide<br>
          <a href="https://x.com/tahigichigi" style="color: #2563eb;">x.com/tahigichigi</a></p>
          
        </body>
      </html>
    `;
  }

  private generateThankYouEmailText(data: ThankYouEmailData): string {
    const firstName = data.customerName ? data.customerName.split(' ')[0] : 'there';
    
    return `Hey ${firstName},

I'm Tahi — I built AI Style Guide because I kept wasting hours piecing together brand-voice docs for clients.

Seeing your order come through today honestly made my week. 🙌

If you have 2 minutes:
1. What problem were you hoping AI Style Guide would solve?
2. What nearly stopped you from buying?
3. Anything else you wanna share :)

And if you've got questions about AIStyleGuide, here's my direct Calendly link (15 min, no pitch): https://calendly.com/l-gichigi/customer-chat

Access your style guide: ${process.env.NEXT_PUBLIC_APP_URL}/full-access?session_id=${data.sessionId}

Thanks again for being one of our very first customers. Anything you need, just hit reply — it's really me on the other end.

Cheers,
Tahi
Founder, AI Style Guide
x.com/tahigichigi`;
  }

  private generateAbandonedCartEmailHTML(data: AbandonedCartEmailData): string {
    const expiryDate = new Date(data.expiresAt * 1000).toLocaleDateString();
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete Your Style Guide - 20% Off</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin-bottom: 10px;">💡 Don't Miss Out!</h1>
            <p style="font-size: 18px; color: #666;">Your style guide is waiting</p>
          </div>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #dc2626;">🎯 Special Offer - 20% Off!</h2>
            <p>We noticed you were interested in creating your AI Style Guide. Complete your purchase now and save 20%!</p>
            ${data.discountCode ? `<p style="background: white; padding: 10px; border-radius: 4px; text-align: center; font-weight: bold; color: #dc2626;">Discount Code: ${data.discountCode}</p>` : ''}
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1e293b;">Why Choose AI Style Guide?</h3>
            <ul style="color: #4b5563;">
              <li>✨ Personalized recommendations based on your brand</li>
              <li>🎨 Professional design guidelines</li>
              <li>📱 Ready-to-use templates and assets</li>
              <li>💼 Boost your brand's professional image</li>
            </ul>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${data.recoveryUrl}" 
                 style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Complete Purchase - 20% Off
              </a>
            </div>
            
            <p style="text-align: center; color: #64748b; font-size: 14px;">
              ⏰ This offer expires on ${expiryDate}
            </p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #64748b; font-size: 14px;">
              Questions? Reply to this email or contact us at 
              <a href="mailto:support@aistyleguide.com" style="color: #2563eb;">support@aistyleguide.com</a>
            </p>
            <p style="color: #64748b; font-size: 14px;">
              Don't want these emails? 
              <a href="#" style="color: #64748b;">Unsubscribe here</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private generateAbandonedCartEmailText(data: AbandonedCartEmailData): string {
    const expiryDate = new Date(data.expiresAt * 1000).toLocaleDateString();
    
    return `
💡 Don't Miss Out - Your Style Guide is Waiting!

🎯 Special Offer - 20% Off!

We noticed you were interested in creating your AI Style Guide. Complete your purchase now and save 20%!

${data.discountCode ? `Discount Code: ${data.discountCode}` : ''}

Why Choose AI Style Guide?
✨ Personalized recommendations based on your brand
🎨 Professional design guidelines  
📱 Ready-to-use templates and assets
💼 Boost your brand's professional image

Complete your purchase: ${data.recoveryUrl}

⏰ This offer expires on ${expiryDate}

Questions? Contact us at support@aistyleguide.com

The AI Style Guide Team
    `;
  }
}

export const emailService = new EmailService();
