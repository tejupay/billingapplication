// Central API & WebSocket URL config — dynamically resolves live backend URL
export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 'https://business-erp-backend.onrender.com';

export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
