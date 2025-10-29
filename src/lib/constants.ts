export const NATIONAL_DOMAIN = import.meta.env.VITE_NATIONAL_DOMAIN || 'www.conexaonacidade.com.br';
export const TENANT_NAME = import.meta.env.VITE_TENANT_NAME || 'Nacional';
export const FN_BASE = import.meta.env.VITE_FN_BASE || `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
export const COOKIE_NAME = 'cnc_tenant';
export const COOKIE_DOMAIN = '.conexaonacidade.com.br';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
