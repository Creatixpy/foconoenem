/**
 * Password Validation Utilities
 * Secure password validation with strength analysis
 */

import { PASSWORD_REQUIREMENTS } from './constants';
import type { PasswordValidationResult } from './types';

/**
 * Validates password against security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    errors.push(`A senha deve ter pelo menos ${PASSWORD_REQUIREMENTS.MIN_LENGTH} caracteres`);
  } else {
    score += 1;
    // Bonus for longer passwords
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
  }

  // Check maximum length
  if (password.length > PASSWORD_REQUIREMENTS.MAX_LENGTH) {
    errors.push(`A senha deve ter no máximo ${PASSWORD_REQUIREMENTS.MAX_LENGTH} caracteres`);
  }

  // Check for uppercase
  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE) {
    if (!/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    } else {
      score += 1;
    }
  }

  // Check for lowercase
  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE) {
    if (!/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    } else {
      score += 1;
    }
  }

  // Check for numbers
  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBER) {
    if (!/[0-9]/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    } else {
      score += 1;
    }
  }

  // Check for special characters (optional but adds to strength)
  if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL) {
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial');
    } else {
      score += 1;
    }
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    // Bonus for special chars even when not required
    score += 1;
  }

  // Check for common patterns (weak passwords)
  const commonPatterns = [
    /^123456/,
    /^password/i,
    /^qwerty/i,
    /^abc123/i,
    /^111111/,
    /^12345678/,
    /^senha/i,
    /^admin/i,
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    errors.push('Evite usar senhas comuns ou sequências previsíveis');
    score = Math.max(0, score - 2);
  }

  // Check for repeated characters
  if (/(.)\1{3,}/.test(password)) {
    errors.push('Evite repetir o mesmo caractere mais de 3 vezes seguidas');
    score = Math.max(0, score - 1);
  }

  // Determine strength
  let strength: PasswordValidationResult['strength'];
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 4) {
    strength = 'fair';
  } else if (score <= 6) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email é obrigatório' };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Email é obrigatório' };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email muito longo' };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Formato de email inválido' };
  }

  return { isValid: true };
}

/**
 * Sanitizes user input for display
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 500); // Limit length
}

/**
 * Gets password strength color for UI
 */
export function getPasswordStrengthColor(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'fair':
      return 'text-orange-500';
    case 'good':
      return 'text-yellow-500';
    case 'strong':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Gets password strength label for UI
 */
export function getPasswordStrengthLabel(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'weak':
      return 'Fraca';
    case 'fair':
      return 'Razoável';
    case 'good':
      return 'Boa';
    case 'strong':
      return 'Forte';
    default:
      return '';
  }
}
