/** Base URL of the asf-cleaner API (backend). Set VITE_API_URL to point elsewhere. */
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000'
