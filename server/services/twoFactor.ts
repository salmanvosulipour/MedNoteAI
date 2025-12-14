import { authenticator } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";

const APP_NAME = "MedNote AI";

export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

export function generateTOTPUri(secret: string, username: string): string {
  return authenticator.keyuri(username, APP_NAME, secret);
}

export async function generateQRCodeDataURL(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

export function verifyTOTPToken(secret: string, token: string): boolean {
  return authenticator.verify({ token, secret });
}

export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code.replace("-", "").toUpperCase()).digest("hex");
}

export function verifyBackupCode(code: string, hashedCodes: string[]): { valid: boolean; index: number } {
  const hashedInput = hashBackupCode(code);
  const index = hashedCodes.findIndex((h) => h === hashedInput);
  return { valid: index !== -1, index };
}
