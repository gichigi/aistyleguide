// This is a mock email service for demonstration purposes
// In a real application, you would use a service like SendGrid, Mailgun, etc.

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
