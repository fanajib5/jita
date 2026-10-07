import axios from 'axios';
import jwt from 'jsonwebtoken';

const ES_BASE_URL =
  process.env.ES_SSO_BASE_URL || 'https://pusates.kampus.ac.id/wp-json/ice-sso/v1';
const ES_ISSUER = process.env.ES_SSO_ISSUER || 'https://pusates.kampus.ac.id/id';
const ES_AUDIENCE = process.env.ES_SSO_AUDIENCE || 'ijete';

// HTTP client wrapper agar mudah diuji / dimock
export const apiClient = {
  get: (url, config) => axios.get(url, config),
  post: (url, data, config) => axios.post(url, data, config),
};

// Cache in-memory public key
let cachedPublicKey = null;
let lastKeyFetchTime = 0;
const KEY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Mengambil Public Key RS256 dari Pusat Es Gateway.
 * Mendukung in-memory caching dan bypass cache saat forceRefresh.
 */
export async function getIcePublicKey(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedPublicKey && now - lastKeyFetchTime < KEY_CACHE_TTL_MS) {
    return cachedPublicKey;
  }

  const endpoint = `${ES_BASE_URL.replace(/\/+$/, '')}/public-key`;
  const response = await apiClient.get(endpoint, { timeout: 7000 });

  if (!response.data || !response.data.public_key) {
    throw new Error('Public key tidak valid dari Pusat Es SSO Gateway');
  }

  cachedPublicKey = response.data.public_key;
  lastKeyFetchTime = now;
  return cachedPublicKey;
}

/**
 * Layer 1: Verifikasi JWT secara lokal dengan Public Key (RS256)
 * Validasi signature kriptografis, issuer, audience, dan exp.
 */
export async function verifyIceJwtLocally(token, options = {}) {
  const {
    publicKey = null,
    expectedIssuer = ES_ISSUER,
    expectedAudience = ES_AUDIENCE,
  } = options;

  let key = publicKey;
  if (!key) {
    key = await getIcePublicKey();
  }

  try {
    const decoded = jwt.verify(token, key, {
      algorithms: ['RS256'],
      issuer: expectedIssuer,
      audience: expectedAudience,
    });
    return { valid: true, payload: decoded };
  } catch (err) {
    // Jika verifikasi gagal dan pakai cached key, coba refresh key sekali lagi (jika key di server di-rotate)
    if (!options.publicKey && cachedPublicKey) {
      try {
        const freshKey = await getIcePublicKey(true);
        const decoded = jwt.verify(token, freshKey, {
          algorithms: ['RS256'],
          issuer: expectedIssuer,
          audience: expectedAudience,
        });
        return { valid: true, payload: decoded };
      } catch (retryErr) {
        return { valid: false, error: retryErr.message };
      }
    }
    return { valid: false, error: err.message };
  }
}

/**
 * Layer 2: Validasi status revoke dan database Pusat Es via endpoint /validate
 * Mengirim POST x-www-form-urlencoded dengan token=<JWT>
 */
export async function validateTokenWithIceCenter(token) {
  const endpoint = `${ES_BASE_URL.replace(/\/+$/, '')}/validate`;
  const params = new URLSearchParams();
  params.append('token', token);

  const response = await apiClient.post(endpoint, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 7000,
  });

  return response.data;
}

/**
 * Helper opsional: Introspect token via /introspect
 */
export async function introspectTokenWithIceCenter(token) {
  const endpoint = `${ES_BASE_URL.replace(/\/+$/, '')}/introspect`;
  const params = new URLSearchParams();
  params.append('token', token);

  const response = await apiClient.post(endpoint, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 7000,
  });

  return response.data;
}

/**
 * Helper opsional: Mendapatkan profile user via /userinfo
 */
export async function getUserInfoFromIceCenter(token) {
  const endpoint = `${ES_BASE_URL.replace(/\/+$/, '')}/userinfo`;
  const params = new URLSearchParams();
  params.append('token', token);

  const response = await apiClient.post(endpoint, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 7000,
  });

  return response.data;
}

export default {
  apiClient,
  getIcePublicKey,
  verifyIceJwtLocally,
  validateTokenWithIceCenter,
  introspectTokenWithIceCenter,
  getUserInfoFromIceCenter,
};
