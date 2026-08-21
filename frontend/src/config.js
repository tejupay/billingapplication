// Central API & WebSocket URL config — dynamically resolves live backend URL
export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://business-erp-backend.onrender.com' 
    : 'http://localhost:8080');

export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
