// Centralized backend API base configuration
// Change here to point all backend services to a new origin

export const BACKEND_ORIGIN = 'https://ceccdb4551ca.ngrok-free.app';
export const API_BASE = `${BACKEND_ORIGIN}/api/v1`;

// If the auth domain also needs to be centralized later, we can add:
// export const AUTH_BASE = 'https://auth.traferr-prod.com/api/v1';
// and update src/services/api.js accordingly.

export default { BACKEND_ORIGIN, API_BASE };

