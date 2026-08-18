// Central API URL config — reads from .env in production, falls back to localhost for dev
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
