import * as SecureStore from 'expo-secure-store';
import { Book, CreateBook, CreateMovie, CreateSeries, MediaStatus, Movie, Series, UpdateBook, UpdateMovie, UpdateSeries, User } from './types';

const API_BASE = 'https://personal-lib.vercel.app';
const TOKEN_KEY = 'auth_token';

// TMDB Configuration (from user)
const TMDB_API_KEY = 'e157d0882d4f7062fb4f2f2933579e93';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export const getToken = async () => await SecureStore.getItemAsync(TOKEN_KEY);
export const saveToken = async (token: string) => await SecureStore.setItemAsync(TOKEN_KEY, token);
export const removeToken = async () => await SecureStore.deleteItemAsync(TOKEN_KEY);

interface AuthResponse {
    token: string;
    user: User;
}

/**
 * Centralized payload preparation to ensure backend compatibility
 */
const preparePayload = (data: any) => {
    if (!data || typeof data !== 'object') return data;

    // Create a copy to avoid mutating original
    const payload = { ...data };

    // Remove empty strings to avoid backend validation errors (empty string != undefined)
    Object.keys(payload).forEach(key => {
        if (payload[key] === '' || payload[key] === null) {
            delete payload[key];
        }
    });

    // Standard mappings for all media types
    if (payload.title) payload.name = payload.title;
    if (payload.coverImage) {
        payload.imageUrl = payload.coverImage;
        payload.image = payload.coverImage;
    }
    if (payload.genre) payload.category = payload.genre;

    // Type specific mappings
    if (payload.author) payload.writer = payload.author;
    if (payload.director) payload.directorName = payload.director;
    if (payload.creator) payload.creatorName = payload.creator;

    return payload;
};

export const api = {
    async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        try {
            const token = await getToken();

            // Auto-prepare body if it's a JSON string
            let finalOptions = { ...options };
            if (options?.body && typeof options.body === 'string') {
                try {
                    const parsedBody = JSON.parse(options.body);
                    finalOptions.body = JSON.stringify(preparePayload(parsedBody));
                } catch (e) {
                    // Not valid JSON, leave as is
                }
            }

            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...finalOptions,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                    ...options?.headers,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    await removeToken();
                }

                const errorData = await response.json().catch(() => ({}));
                let errorMessage = errorData.error || errorData.message || `Hata: ${response.status}`;

                // Handle Zod/Object error format from backend
                if (typeof errorData.error === 'object') {
                    errorMessage = Object.values(errorData.error).flat().join(', ');
                }

                // Log to console for debugging in dev, but don't use error level to avoid UI bubble
                if (__DEV__) {
                    console.warn(`[API Info] ${response.status} ${endpoint}:`, errorData);
                }

                // Global Sanitization: Remove annoying prefixes
                errorMessage = errorMessage.replace(/^Error:\s*/i, '').replace(/^\[.*?\]\s*Error:\s*/i, '');

                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error: any) {
            // Use warn instead of error to prevent some interceptors from popping up UI notices
            if (__DEV__) console.warn(`[API Log] ${endpoint}:`, error.message || error);

            if (error.message === 'Network request failed') {
                throw new Error('Bağlantı sorunu yaşanıyor.');
            }
            throw error;
        }
    },

    auth: {
        login: (credentials: any) => api.request<AuthResponse>('/api/auth/mobile', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),
        register: (data: any) => api.request<AuthResponse>('/api/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        forgotPassword: (email: string) => api.request<{ message: string }>('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),
        resetPassword: (data: any) => api.request<{ message: string }>('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    },

    books: {
        list: () => api.request<Book[]>('/api/books'),
        create: (data: CreateBook) => api.request<Book>('/api/books', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: UpdateBook) => api.request<Book>('/api/books', {
            method: 'PATCH',
            body: JSON.stringify({ ...data, id }),
        }),
        delete: (id: string) => api.request(`/api/books?id=${id}`, {
            method: 'DELETE',
        }),
    },

    movies: {
        list: () => api.request<Movie[]>('/api/movies'),
        create: (data: CreateMovie) => api.request<Movie>('/api/movies', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: UpdateMovie) => api.request<Movie>('/api/movies', {
            method: 'PATCH',
            body: JSON.stringify({ ...data, id }),
        }),
        delete: (id: string) => api.request(`/api/movies?id=${id}`, {
            method: 'DELETE',
        }),
    },

    series: {
        list: () => api.request<Series[]>('/api/series'),
        create: (data: CreateSeries) => api.request<Series>('/api/series', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: UpdateSeries) => api.request<Series>('/api/series', {
            method: 'PATCH',
            body: JSON.stringify({ ...data, id }),
        }),
        delete: (id: string) => api.request(`/api/series?id=${id}`, {
            method: 'DELETE',
        }),
    },

    search: {
        books: (q: string) => api.request<Book[]>(`/api/search/books?q=${encodeURIComponent(q)}`),
        movies: async (q: string) => {
            // First try TMDB directly for better results if we have the key
            try {
                const response = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=tr-TR`);
                const data = await response.json();
                return data.results.map((m: any) => ({
                    id: m.id.toString(),
                    title: m.title,
                    director: '', // TMDB search doesn't return director directly
                    coverImage: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : undefined,
                    genre: '', // Needs separate call usually, but we can skip for now
                    status: 'WISHLIST' as MediaStatus,
                    description: m.overview
                }));
            } catch (e) {
                // Fallback to backend search
                return api.request<Movie[]>(`/api/search/movies?q=${encodeURIComponent(q)}`);
            }
        },
        series: async (q: string) => {
            try {
                const response = await fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=tr-TR`);
                const data = await response.json();
                return data.results.map((s: any) => ({
                    id: s.id.toString(),
                    title: s.name,
                    creator: '',
                    coverImage: s.poster_path ? `${TMDB_IMAGE_BASE}${s.poster_path}` : undefined,
                    genre: '',
                    status: 'WISHLIST' as MediaStatus,
                    description: s.overview
                }));
            } catch (e) {
                // Fallback to backend search
                return api.request<Series[]>(`/api/search/series?q=${encodeURIComponent(q)}`);
            }
        },
    },

    utils: {
        optimizeImage: (url?: string) => {
            if (!url || !url.startsWith('http')) return url;
            // If it's already a TMDB image, no need to proxy if not requested, but proxy helps for all
            return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=400&q=80&output=webp`;
        }
    }
};
