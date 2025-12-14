import { Resend } from 'resend';

interface ResendCredentials {
  apiKey: string;
  fromEmail: string;
}

async function getCredentials(): Promise<ResendCredentials> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  
  const data = await response.json();
  const settings = data.items?.[0]?.settings;

  if (!settings || !settings.api_key) {
    throw new Error('Resend not connected');
  }
  
  return {
    apiKey: settings.api_key,
    fromEmail: settings.from_email || 'MedNote AI <onboarding@resend.dev>'
  };
}

export async function getResendClient(): Promise<{ client: Resend; fromEmail: string }> {
  const creds = await getCredentials();
  return {
    client: new Resend(creds.apiKey),
    fromEmail: creds.fromEmail
  };
}

export interface CaseSummaryEmailData {
  patientName: string;
  patientEmail: string;
  chiefComplaint: string;
  assessment?: string;
  plan?: string;
  patientEducation?: string;
  treatmentRedFlags?: string;
  medications?: Array<{name: string; dose: string; frequency: string; duration: string; instructions: string}>;
  physicianName?: string;
}

export interface PasswordResetEmailData {
  email: string;
  resetLink: string;
}

export interface EmailVerificationData {
  email: string;
  userName: string;
  verificationLink: string;
}

export async function sendVerificationEmail(data: EmailVerificationData): Promise<{id: string; status: string}> {
  const { client, fromEmail } = await getResendClient();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 24px;">Welcome to MedNote AI!</h1>
      </div>
      
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p>Hello ${data.userName},</p>
        
        <p>Thank you for signing up! Please verify your email address to start using MedNote AI.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">
          This link will expire in 24 hours. If you didn't create an account with MedNote AI, you can safely ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        
        <p style="color: #94a3b8; font-size: 12px;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <span style="word-break: break-all;">${data.verificationLink}</span>
        </p>
      </div>
    </body>
    </html>
  `;

  const result = await client.emails.send({
    from: fromEmail,
    to: data.email,
    subject: 'Verify Your MedNote AI Email',
    html: htmlContent,
  });

  if (result.error) {
    throw new Error(`Failed to send verification email: ${result.error.message}`);
  }

  if (!result.data?.id) {
    throw new Error('Email sent but no message ID returned');
  }

  return {
    id: result.data.id,
    status: 'sent'
  };
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{id: string; status: string}> {
  const { client, fromEmail } = await getResendClient();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
      </div>
      
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p>We received a request to reset your password for your MedNote AI account.</p>
        
        <p>Click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.resetLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        
        <p style="color: #94a3b8; font-size: 12px;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <span style="word-break: break-all;">${data.resetLink}</span>
        </p>
      </div>
    </body>
    </html>
  `;

  const result = await client.emails.send({
    from: fromEmail,
    to: data.email,
    subject: 'Reset Your MedNote AI Password',
    html: htmlContent,
  });

  if (result.error) {
    throw new Error(`Failed to send email: ${result.error.message}`);
  }

  if (!result.data?.id) {
    throw new Error('Email sent but no message ID returned');
  }

  return {
    id: result.data.id,
    status: 'sent'
  };
}

export async function sendCaseSummaryEmail(data: CaseSummaryEmailData): Promise<{id: string; status: string}> {
  const { client, fromEmail } = await getResendClient();

  const medicationsHtml = data.medications && data.medications.length > 0
    ? `
      <h3 style="color: #7c3aed; margin-top: 24px;">Discharge Medications</h3>
      <ul style="list-style: none; padding: 0;">
        ${data.medications.map(med => `
          <li style="background: #f3f0ff; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
            <strong>${med.name}</strong> - ${med.dose}<br/>
            <span style="color: #666;">${med.frequency} for ${med.duration}</span><br/>
            <em style="color: #7c3aed;">${med.instructions}</em>
          </li>
        `).join('')}
      </ul>
    `
    : '';

  const redFlagsHtml = data.treatmentRedFlags
    ? `
      <h3 style="color: #dc2626; margin-top: 24px;">⚠️ Warning Signs - Seek Immediate Care If:</h3>
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px;">
        <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${data.treatmentRedFlags}</pre>
      </div>
    `
    : '';

  const educationHtml = data.patientEducation
    ? `
      <h3 style="color: #059669; margin-top: 24px;">Patient Education</h3>
      <div style="background: #ecfdf5; padding: 16px; border-radius: 8px;">
        <p style="margin: 0;">${data.patientEducation}</p>
      </div>
    `
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Medical Visit Summary</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 24px;">Your Medical Visit Summary</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">Hello ${data.patientName},</p>
      </div>
      
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <h3 style="color: #1e40af; margin-top: 0;">Chief Complaint</h3>
        <p>${data.chiefComplaint}</p>
        
        ${data.assessment ? `
          <h3 style="color: #1e40af; margin-top: 24px;">Assessment</h3>
          <p>${data.assessment}</p>
        ` : ''}
        
        ${data.plan ? `
          <h3 style="color: #1e40af; margin-top: 24px;">Treatment Plan</h3>
          <pre style="white-space: pre-wrap; font-family: inherit; background: #eff6ff; padding: 16px; border-radius: 8px; margin: 0;">${data.plan}</pre>
        ` : ''}
        
        ${medicationsHtml}
        ${educationHtml}
        ${redFlagsHtml}
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
        
        <p style="color: #64748b; font-size: 14px;">
          This summary was generated by MedNote AI. If you have any questions about your visit, please contact your healthcare provider.
          ${data.physicianName ? `<br/><br/>Best regards,<br/><strong>${data.physicianName}</strong>` : ''}
        </p>
      </div>
    </body>
    </html>
  `;

  const result = await client.emails.send({
    from: fromEmail,
    to: data.patientEmail,
    subject: `Your Medical Visit Summary - ${data.chiefComplaint}`,
    html: htmlContent,
  });

  if (result.error) {
    throw new Error(`Failed to send email: ${result.error.message}`);
  }

  if (!result.data?.id) {
    throw new Error('Email sent but no message ID returned');
  }

  return {
    id: result.data.id,
    status: 'sent'
  };
}
