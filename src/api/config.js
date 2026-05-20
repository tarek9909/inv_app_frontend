export const DEFAULT_API_BASE_URL = 'https://inv-ahmad.onrender.com/api/v1';
export const DEFAULT_API_TIMEOUT_MS = 20000;
export const DEFAULT_API_CACHE_MS = 3000;

export const normalizeBaseUrl = (baseUrl) => String(baseUrl || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '');

const normalizeTimeout = (value) => {
  const timeout = Number(value);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_API_TIMEOUT_MS;
};

const normalizeCacheMs = (value) => {
  const cacheMs = Number(value);
  return Number.isFinite(cacheMs) && cacheMs >= 0 ? cacheMs : DEFAULT_API_CACHE_MS;
};

let runtimeConfig = {
  baseUrl: normalizeBaseUrl(
    import.meta.env?.VITE_API_BASE_URL ||
    globalThis?.__STOCK_DRIVER_API_BASE_URL__ ||
    DEFAULT_API_BASE_URL
  ),
  timeoutMs: normalizeTimeout(import.meta.env?.VITE_API_TIMEOUT_MS),
  cacheMs: normalizeCacheMs(import.meta.env?.VITE_API_CACHE_MS)
};

export const getApiConfig = () => ({ ...runtimeConfig });

export const configureApi = (config = {}) => {
  runtimeConfig = {
    ...runtimeConfig,
    ...config,
    baseUrl: normalizeBaseUrl(config.baseUrl || runtimeConfig.baseUrl),
    timeoutMs: normalizeTimeout(config.timeoutMs || runtimeConfig.timeoutMs),
    cacheMs: normalizeCacheMs(config.cacheMs ?? runtimeConfig.cacheMs)
  };
  return getApiConfig();
};
