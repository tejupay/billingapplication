// Central API URL config — reads from .env in production, dynamically resolves Render backend URL
export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://business-erp-backend.onrender.com' 
    : 'http://localhost:8080');
