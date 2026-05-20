import { DEFAULT_API_CACHE_MS, DEFAULT_API_TIMEOUT_MS, getApiConfig, normalizeBaseUrl } from './config.js';
import { tokenStorage } from './tokenStorage.js';

export class ApiError extends Error {
  constructor({ status, message, errors, response }) {
    super(message || 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors || [];
    this.response = response;
  }
}

const hasBody = (method) => !['GET', 'HEAD'].includes(method.toUpperCase());

export const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : '';
};

export const createHttpClient = ({ baseUrl, getToken = tokenStorage.get, onUnauthorized, timeoutMs, cacheMs } = {}) => {
  const inFlightGets = new Map();
  const responseCache = new Map();

  const clearResponseCache = () => responseCache.clear();

  const request = async (path, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const token = getToken?.();
    const apiConfig = getApiConfig();
    const configuredTimeout = Number(options.timeoutMs || timeoutMs || apiConfig.timeoutMs || DEFAULT_API_TIMEOUT_MS);
    const requestTimeout = Number.isFinite(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : DEFAULT_API_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);
    const headers = {
      Accept: 'application/json',
      ...(hasBody(method) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };
    const resolvedBaseUrl = normalizeBaseUrl(baseUrl || apiConfig.baseUrl);
    const url = `${resolvedBaseUrl}${path}${buildQuery(options.query)}`;
    const isGet = method === 'GET';
    const configuredCacheMs = Number(options.cacheMs ?? cacheMs ?? apiConfig.cacheMs ?? DEFAULT_API_CACHE_MS);
    const requestCacheMs = Number.isFinite(configuredCacheMs) && configuredCacheMs >= 0
      ? configuredCacheMs
      : DEFAULT_API_CACHE_MS;
    const cacheKey = isGet
      ? `${url}|${token || ''}|${JSON.stringify(options.headers || {})}`
      : '';

    if (isGet && requestCacheMs > 0) {
      const cached = responseCache.get(cacheKey);
      if (cached && Date.now() - cached.at < requestCacheMs) return cached.result;
      if (cached) responseCache.delete(cacheKey);
    }

    if (isGet && inFlightGets.has(cacheKey)) return inFlightGets.get(cacheKey);

    let response;
    let payload;

    const fetchPromise = (async () => {
      response = await fetch(url, {
        ...options,
        method,
        headers,
        signal: options.signal || controller.signal,
        body: hasBody(method) && options.body !== undefined ? JSON.stringify(options.body) : undefined
      });
      payload = await readPayload(response);

      if (!response.ok || payload?.success === false) {
        if (response.status === 401) onUnauthorized?.();
        throw new ApiError({
          status: response.status,
          message: payload?.message || response.statusText,
          errors: payload?.errors,
          response: payload
        });
      }

      const result = {
        data: payload?.data,
        meta: payload?.meta || {},
        message: payload?.message || '',
        raw: payload
      };

      if (isGet && requestCacheMs > 0) {
        responseCache.set(cacheKey, { at: Date.now(), result });
      } else if (!isGet) {
        clearResponseCache();
      }

      return result;
    })();

    if (isGet) inFlightGets.set(cacheKey, fetchPromise);

    try {
      return await fetchPromise;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError({
          status: 408,
          message: `Request timed out after ${requestTimeout}ms`,
          errors: [],
          response: null
        });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      if (isGet) inFlightGets.delete(cacheKey);
    }
  };

  return {
    get: (path, query, options) => request(path, { ...options, method: 'GET', query }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
    request,
    clearResponseCache
  };
};

const readPayload = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { success: response.ok, data: text };
  }
};

export const http = createHttpClient();
