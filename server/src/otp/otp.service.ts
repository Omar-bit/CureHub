import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface OTPConfig {
  length: number;
  expiryMinutes: number;
  includeLetters: boolean;
  includeNumbers: boolean;
  includeSpecialChars: boolean;
}

export interface OTPResult {
  code: string;
  expiryDate: Date;
}

@Injectable()
export class OtpService {
  private readonly defaultConfig: OTPConfig = {
    length: 6,
    expiryMinutes: 15,
    includeLetters: false,
    includeNumbers: true,
    includeSpecialChars: false,
  };

  /**
   * Generate a secure OTP code
   */
  generateOTP(config?: Partial<OTPConfig>): OTPResult {
    const finalConfig = { ...this.defaultConfig, ...config };

    let characters = '';

    if (finalConfig.includeNumbers) {
      characters += '0123456789';
    }

    if (finalConfig.includeLetters) {
      characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }

    if (finalConfig.includeSpecialChars) {
      characters += '!@#$%^&*';
    }

    if (!characters) {
      throw new Error(
        'At least one character type must be enabled for OTP generation',
      );
    }

    let code = '';
    for (let i = 0; i < finalConfig.length; i++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      code += characters[randomIndex];
    }

    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + finalConfig.expiryMinutes);

    return {
      code,
      expiryDate,
    };
  }

  /**
   * Generate email verification OTP (6-digit numeric)
   */
  generateEmailVerificationOTP(expiryMinutes: number = 15): OTPResult {
    return this.generateOTP({
      length: 6,
      expiryMinutes,
      includeNumbers: true,
      includeLetters: false,
      includeSpecialChars: false,
    });
  }

  /**
   * Generate SMS verification OTP (4-digit numeric for easier typing)
   */
  generateSMSVerificationOTP(expiryMinutes: number = 10): OTPResult {
    return this.generateOTP({
      length: 4,
      expiryMinutes,
      includeNumbers: true,
      includeLetters: false,
      includeSpecialChars: false,
    });
  }

  /**
   * Validate OTP code against stored data
   */
  validateOTP(
    inputCode: string,
    storedCode: string,
    expiryDate: Date,
    caseInsensitive: boolean = true,
  ): boolean {
    if (!inputCode || !storedCode || !expiryDate) {
      return false;
    }

    // Check if OTP has expired
    if (new Date() > expiryDate) {
      return false;
    }

    // Compare codes
    const normalizedInput = caseInsensitive
      ? inputCode.toUpperCase()
      : inputCode;
    const normalizedStored = caseInsensitive
      ? storedCode.toUpperCase()
      : storedCode;

    return normalizedInput === normalizedStored;
  }

  /**
   * Check if OTP has expired
   */
  isOTPExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate;
  }

  /**
   * Calculate remaining minutes until OTP expiry
   */
  getExpiryMinutesRemaining(expiryDate: Date): number {
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60)));
  }

  /**
   * Generate a secure random token (for password reset, etc.)
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash OTP for secure storage (optional security enhancement)
   */
  hashOTP(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Verify hashed OTP
   */
  verifyHashedOTP(inputCode: string, hashedCode: string): boolean {
    const hashedInput = this.hashOTP(inputCode);
    return hashedInput === hashedCode;
  }
}
