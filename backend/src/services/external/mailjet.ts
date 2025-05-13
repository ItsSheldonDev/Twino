

import axios from 'axios';
import Config from '../../config';

interface MailjetRecipient {
  Email: string;
  Name?: string;
}

interface MailjetMessage {
  From: {
    Email: string;
    Name: string;
  };
  To: MailjetRecipient[];
  Subject: string;
  TextPart?: string;
  HTMLPart?: string;
  CustomID?: string;
}

class MailjetService {
  private apiKey: string;
  private apiSecret: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiKey = Config.MAILJET.API_KEY;
    this.apiSecret = Config.MAILJET.API_SECRET;
    this.fromEmail = Config.MAILJET.FROM_EMAIL;
    this.fromName = Config.MAILJET.FROM_NAME;
  }

  /**
   * Envoie un email via Mailjet
   */
  async sendEmail(to: string, subject: string, text: string, html: string): Promise<boolean> {
    try {
      const message: MailjetMessage = {
        From: {
          Email: this.fromEmail,
          Name: this.fromName
        },
        To: [{ Email: to }],
        Subject: subject,
        TextPart: text,
        HTMLPart: html
      };

      const response = await axios.post(
        'https://api.mailjet.com/v3.1/send',
        { Messages: [message] },
        {
          auth: {
            username: this.apiKey,
            password: this.apiSecret
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return false;
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(email: string, resetUrl: string, name: string): Promise<boolean> {
    const subject = 'Réinitialisation de votre mot de passe - Budget Couple';
    
    const text = `
      Bonjour ${name},
      
      Vous avez demandé la réinitialisation de votre mot de passe.
      
      Pour finaliser cette procédure, veuillez cliquer sur le lien suivant :
      ${resetUrl}
      
      Ce lien est valable pendant 24 heures.
      
      Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.
      
      Cordialement,
      L'équipe Budget Couple
    `;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">Réinitialisation de votre mot de passe</h2>
        <p>Bonjour ${name},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Pour finaliser cette procédure, veuillez cliquer sur le bouton ci-dessous :</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p>Ce lien est valable pendant 24 heures.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
        <p>Cordialement,<br>L'équipe Budget Couple</p>
      </div>
    `;
    
    return this.sendEmail(email, subject, text, html);
  }

  /**
   * Envoie une notification de changement d'email
   */
  async sendEmailChangeNotification(oldEmail: string, newEmail: string, name: string): Promise<boolean> {
    const subject = 'Modification de votre adresse email - Budget Couple';
    
    const text = `
      Bonjour ${name},
      
      Nous vous confirmons que votre adresse email a été modifiée.
      
      Ancienne adresse : ${oldEmail}
      Nouvelle adresse : ${newEmail}
      
      Si vous n'êtes pas à l'origine de ce changement, veuillez contacter immédiatement notre service client.
      
      Cordialement,
      L'équipe Budget Couple
    `;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">Modification de votre adresse email</h2>
        <p>Bonjour ${name},</p>
        <p>Nous vous confirmons que votre adresse email a été modifiée.</p>
        <p><strong>Ancienne adresse :</strong> ${oldEmail}</p>
        <p><strong>Nouvelle adresse :</strong> ${newEmail}</p>
        <p style="color: #e53e3e; margin-top: 20px;">
          Si vous n'êtes pas à l'origine de ce changement, veuillez contacter immédiatement notre service client.
        </p>
        <p>Cordialement,<br>L'équipe Budget Couple</p>
      </div>
    `;
    

    const oldEmailSent = await this.sendEmail(oldEmail, subject, text, html);
    const newEmailSent = await this.sendEmail(newEmail, subject, text, html);
    
    return oldEmailSent && newEmailSent;
  }
}

export default new MailjetService();