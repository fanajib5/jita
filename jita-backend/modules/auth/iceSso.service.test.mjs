import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import iceSsoModule from './iceSso.service.js';

const { verifyIceJwtLocally, validateTokenWithIceCenter } = iceSsoModule;

describe('Pusat Es SSO Service Unit Tests', () => {
  // Generate real RSA key pair for cryptographic verification tests
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const VALID_ISSUER = 'https://pusates.kampusmu.id/id';
  const VALID_AUDIENCE = 'ijete';

  function createTestToken(payloadOverrides = {}, options = {}) {
    const defaultPayload = {
      iss: VALID_ISSUER,
      aud: VALID_AUDIENCE,
      sub: '139',
      email: '05221073@student.itk.ac.id',
      name: 'Lilis Ariyanti',
      jti: 'c3fa0243-15dc-408d-9c66-60c96dfa3617',
    };
    return jwt.sign(
      { ...defaultPayload, ...payloadOverrides },
      privateKey,
      {
        algorithm: 'RS256',
        expiresIn: options.expiresIn || '30m',
      }
    );
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Layer 1: Local RS256 Verification (PDF Test Cases 1-5)', () => {
    it('Test 1 — Valid JWT: should verify successfully', async () => {
      const token = createTestToken();
      const result = await verifyIceJwtLocally(token, {
        publicKey,
        expectedIssuer: VALID_ISSUER,
        expectedAudience: VALID_AUDIENCE,
      });

      expect(result.valid).toBe(true);
      expect(result.payload.sub).toBe('139');
      expect(result.payload.name).toBe('Lilis Ariyanti');
    });

    it('Test 2 — Wrong Issuer: should reject invalid issuer', async () => {
      const token = createTestToken({ iss: 'https://fake-issuer.com' });
      const result = await verifyIceJwtLocally(token, {
        publicKey,
        expectedIssuer: VALID_ISSUER,
        expectedAudience: VALID_AUDIENCE,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/jwt issuer invalid/i);
    });

    it('Test 3 — Wrong Audience: should reject unexpected audience', async () => {
      const token = createTestToken({ aud: 'something-else' });
      const result = await verifyIceJwtLocally(token, {
        publicKey,
        expectedIssuer: VALID_ISSUER,
        expectedAudience: VALID_AUDIENCE,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/jwt audience invalid/i);
    });

    it('Test 4 — Expired JWT: should reject expired token', async () => {
      const token = createTestToken({}, { expiresIn: '-10s' });
      const result = await verifyIceJwtLocally(token, {
        publicKey,
        expectedIssuer: VALID_ISSUER,
        expectedAudience: VALID_AUDIENCE,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/jwt expired/i);
    });

    it('Test 5 — Invalid Signature: should reject tampered token', async () => {
      const token = createTestToken();
      // Tamper signature part of JWT
      const tampered = token.slice(0, -5) + 'xxxxx';
      const result = await verifyIceJwtLocally(tampered, {
        publicKey,
        expectedIssuer: VALID_ISSUER,
        expectedAudience: VALID_AUDIENCE,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/invalid signature/i);
    });
  });

  describe('Layer 2: Remote Revocation & Server Status (PDF Test Cases 6-8)', () => {
    it('Test 6 — Revoked Token: should return invalid with token_revoked reason', async () => {
      const spy = vi.spyOn(iceSsoModule.apiClient, 'post').mockResolvedValueOnce({
        data: {
          valid: false,
          reason: 'token_revoked',
        },
      });

      const response = await validateTokenWithIceCenter('dummy-revoked-token');
      expect(response.valid).toBe(false);
      expect(response.reason).toBe('token_revoked');
      expect(spy).toHaveBeenCalled();
    });

    it('Test 7 — Token tidak terdaftar: should return token_not_found', async () => {
      const spy = vi.spyOn(iceSsoModule.apiClient, 'post').mockResolvedValueOnce({
        data: {
          valid: false,
          reason: 'token_not_found',
        },
      });

      const response = await validateTokenWithIceCenter('unregistered-jwt');
      expect(response.valid).toBe(false);
      expect(response.reason).toBe('token_not_found');
      expect(spy).toHaveBeenCalled();
    });

    it('Valid Token from Remote: returns user payload', async () => {
      const spy = vi.spyOn(iceSsoModule.apiClient, 'post').mockResolvedValueOnce({
        data: {
          valid: true,
          user_id: '139',
          email: '05221073@student.itk.ac.id',
          name: 'Lilis Ariyanti',
          jti: 'c3fa0243-15dc-408d-9c66-60c96dfa3617',
          exp: 1787510090,
        },
      });

      const response = await validateTokenWithIceCenter('valid-token');
      expect(response.valid).toBe(true);
      expect(response.user_id).toBe('139');
      expect(response.name).toBe('Lilis Ariyanti');
      expect(spy).toHaveBeenCalled();
    });
  });
});
