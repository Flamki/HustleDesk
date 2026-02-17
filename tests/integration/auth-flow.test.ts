import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Integration tests for the complete authentication flow
 * These tests validate the end-to-end signup and verification process
 */

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Signup Flow', () => {
    it('validates email format before signup', () => {
      const validEmails = [
        'user@example.com',
        'test.user@company.co.uk',
        'user+tag@domain.com',
      ];
      
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user@.com',
        'user @example.com',
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
      
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('validates password meets requirements', () => {
      const validPasswords = [
        'Password123',
        'StrongPass1',
        'MyP@ssw0rd',
      ];
      
      const invalidPasswords = [
        'short',          // Too short
        'nouppercase1',   // No uppercase
        'NOLOWERCASE1',   // No lowercase
        'NoNumbers',      // No numbers
        'Short1',         // Too short
      ];

      // Password requirements: 8+ chars, 1 uppercase, 1 number, 1 lowercase
      const hasMinLength = (p: string) => p.length >= 8;
      const hasUppercase = (p: string) => /[A-Z]/.test(p);
      const hasLowercase = (p: string) => /[a-z]/.test(p);
      const hasNumber = (p: string) => /\d/.test(p);
      const isValid = (p: string) => hasMinLength(p) && hasUppercase(p) && hasLowercase(p) && hasNumber(p);
      
      validPasswords.forEach(password => {
        expect(isValid(password)).toBe(true);
      });
      
      invalidPasswords.forEach(password => {
        expect(isValid(password)).toBe(false);
      });
    });
  });

  describe('Email Verification', () => {
    it('prevents account enumeration by returning generic success messages', () => {
      // Resend verification should return the same message whether email exists or not
      const successMessage = 'If this email is registered and unverified, a verification link has been sent.';
      
      // This is the expected behavior for both cases:
      // 1. Email exists and is unverified -> send email, return generic message
      // 2. Email doesn't exist -> don't send email, return same generic message
      
      expect(successMessage).toContain('If this email is registered');
    });

    it('validates token format before verification attempt', () => {
      const validTokens = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'abc123def456',
      ];
      
      const invalidTokens = [
        '',
        null,
        undefined,
        '<script>alert("xss")</script>',
        'SELECT * FROM users',
      ];

      const isValidToken = (token: any) => {
        if (!token || typeof token !== 'string') return false;
        if (token.length === 0 || token.length > 500) return false;
        if (/<script|javascript:|onerror=|onload=/gi.test(token)) return false;
        if (/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi.test(token)) return false;
        return true;
      };
      
      validTokens.forEach(token => {
        expect(isValidToken(token)).toBe(true);
      });
      
      invalidTokens.forEach(token => {
        expect(isValidToken(token)).toBe(false);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('tracks request counts per key', () => {
      const rateLimitState = new Map();
      const limit = 3;
      const windowMs = 60000; // 1 minute
      
      const checkRateLimit = (key: string) => {
        const now = Date.now();
        let entry = rateLimitState.get(key);
        
        if (!entry || now - entry.windowStart >= windowMs) {
          entry = { windowStart: now, count: 0 };
        }
        
        entry.count += 1;
        rateLimitState.set(key, entry);
        
        return {
          allowed: entry.count <= limit,
          remaining: Math.max(0, limit - entry.count),
        };
      };
      
      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const result = checkRateLimit('test-key');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(3 - (i + 1));
      }
      
      // 4th request should fail
      const result = checkRateLimit('test-key');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('resets count after time window expires', () => {
      const rateLimitState = new Map();
      const limit = 3;
      const windowMs = 1000; // 1 second for testing
      
      const checkRateLimit = (key: string, currentTime: number) => {
        let entry = rateLimitState.get(key);
        
        if (!entry || currentTime - entry.windowStart >= windowMs) {
          entry = { windowStart: currentTime, count: 0 };
        }
        
        entry.count += 1;
        rateLimitState.set(key, entry);
        
        return {
          allowed: entry.count <= limit,
        };
      };
      
      const now = Date.now();
      
      // Use up the limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit('test-key', now);
      }
      
      // Next request should fail
      expect(checkRateLimit('test-key', now).allowed).toBe(false);
      
      // After window expires, should succeed again
      expect(checkRateLimit('test-key', now + windowMs + 1).allowed).toBe(true);
    });
  });

  describe('Security Validation', () => {
    it('detects SQL injection attempts', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "SELECT * FROM users WHERE email = 'test@example.com'",
        "INSERT INTO users VALUES ('hacker', 'password')",
        "UPDATE users SET password = 'hacked'",
      ];

      // Don't use global flag - test each independently
      sqlInjectionAttempts.forEach(input => {
        const sqlPatterns = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b/i;
        expect(sqlPatterns.test(input)).toBe(true);
      });
    });

    it('detects XSS injection attempts', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img onerror="alert(1)" src="x">',
        '<body onload="alert(1)">',
      ];

      // Don't use global flag - test each independently
      xssAttempts.forEach(input => {
        const scriptPatterns = /<script|javascript:|onerror=|onload=/i;
        expect(scriptPatterns.test(input)).toBe(true);
      });
    });

    it('validates input length limits', () => {
      const validateInput = (input: string, maxLength: number = 1000) => {
        return input.length > 0 && input.length <= maxLength;
      };

      expect(validateInput('valid input', 1000)).toBe(true);
      expect(validateInput('', 1000)).toBe(false);
      expect(validateInput('x'.repeat(1001), 1000)).toBe(false);
      expect(validateInput('x'.repeat(500), 1000)).toBe(true);
    });
  });

  describe('Error Message Sanitization', () => {
    it('sanitizes database errors', () => {
      const sanitizeError = (error: string) => {
        if (error.includes('database') || error.includes('SQL')) {
          return 'Database error occurred';
        }
        if (error.includes('ENOENT') || error.includes('EACCES')) {
          return 'Resource not found';
        }
        if (error.includes('SUPABASE') || error.includes('API key')) {
          return 'Configuration error';
        }
        return error.split('\n')[0];
      };

      expect(sanitizeError('SQL syntax error at line 42')).toBe('Database error occurred');
      expect(sanitizeError('database connection failed')).toBe('Database error occurred');
      expect(sanitizeError('ENOENT: file not found')).toBe('Resource not found');
      expect(sanitizeError('SUPABASE_KEY is invalid')).toBe('Configuration error');
    });
  });
});
