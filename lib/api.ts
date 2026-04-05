import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getLanguage, tStatic } from './i18n';
import { Book, CreateBook, CreateMovie, CreateSeries, Movie, Series, UpdateBook, UpdateMovie, UpdateSeries, User } from './types';

const API_BASE = 'https://personal-lib.vercel.app';
const TOKEN_KEY = 'auth_token';

const REQUEST_TIMEOUT = 30000; // Increased to 30s for stability in Expo Go

export const getToken = async () => await SecureStore.getItemAsync(TOKEN_KEY);
export const saveToken = async (token: string) => await SecureStore.setItemAsync(TOKEN_KEY, token);
export const removeToken = async () => await SecureStore.deleteItemAsync(TOKEN_KEY);

interface AuthResponse {
    token: string;
    user: User;
}

export interface PublicPortfolio {
    books: any[];
    movies: any[];
    series: any[];
    user?: {
        username: string;
        displayName: string;
        avatarUrl?: string;
        isPrivate?: boolean;
        is_private?: boolean;
    };
    // Support flat structure as fallback
    username?: string;
    isPrivate?: boolean;
    is_private?: boolean;
    collections?: {
        books: any[];
        movies: any[];
        series: any[];
    };
}

const preparePayload = (data: any, type?: 'book' | 'movie' | 'series') => {
    if (!data || typeof data !== 'object') return data;

    const payload = { ...data };

    // Remove empty values to prevent backend validation errors
    Object.keys(payload).forEach(key => {
        if (payload[key] === '' || payload[key] === null) {
            delete payload[key];
        }
    });

    // Handle Series-specific status mapping (Web summary line 273)
    if (type === 'series' && payload.status) {
        payload.overallStatus = payload.status;
    }

    // Naming alignment with Prisma models (Web summary lines 91-93)
    // We prioritize using the model's own field names (title, author, director, creator)
    if (payload.title) payload.title = payload.title; // Keep title
    if (payload.coverImage) {
        payload.imageUrl = payload.coverImage;
        payload.image = payload.coverImage;
    }

    // These renames are likely from old field mappings, 
    // ensuring we also keep the original model keys if they exist.
    if (!payload.author && payload.writer) payload.author = payload.writer;
    if (!payload.director && payload.directorName) payload.director = payload.directorName;
    if (!payload.creator && payload.creatorName) payload.creator = payload.creatorName;

    if (payload.id) {
        payload.userBookId = payload.id;
        payload.userMovieId = payload.id;
        payload.userSeriesId = payload.id;
    }

    return payload;
};

export const api = {
    async request<T>(endpoint: string, options?: RequestInit, retryCount = 1): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        try {
            // "Warm-up" fetch to wake up the network stack (common workaround for Android/Expo network issues)
            if (endpoint.includes('/auth/mobile')) {
                await fetch('https://www.google.com').catch(() => { });
            }

            const token = await getToken();

            let finalOptions = { ...options };
            if (options?.body && typeof options.body === 'string') {
                try {
                    const parsedBody = JSON.parse(options.body);
                    let type: 'book' | 'movie' | 'series' | undefined;
                    if (endpoint.includes('/books')) type = 'book';
                    else if (endpoint.includes('/movies')) type = 'movie';
                    else if (endpoint.includes('/series')) type = 'series';

                    finalOptions.body = JSON.stringify(preparePayload(parsedBody, type));
                } catch (e) {
                    // Not valid JSON, leave as is
                }
            }

            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...finalOptions,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                    ...options?.headers,
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 401) {
                    await removeToken();
                }

                const errorData = await response.json().catch(() => ({}));

                let errorMessage = errorData.error || errorData.message || `Hata: ${response.status}`;

                if (typeof errorData.error === 'object') {
                    errorMessage = Object.values(errorData.error).flat().join(', ');
                }

                if (__DEV__) {
                    console.warn(`[API Info] ${response.status} ${endpoint}`);
                }

                errorMessage = errorMessage.replace(/^Error:\s*/i, '').replace(/^\[.*?\]\s*Error:\s*/i, '');

                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error: any) {
            clearTimeout(timeoutId);

            // Handle Retry for transient network errors
            if (retryCount > 0 && (error.message === 'Network request failed' || error.name === 'AbortError')) {
                if (__DEV__) console.log(`[API Retry] Retrying ${endpoint}... Attempts left: ${retryCount}`);
                // Wait 1s before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.request(endpoint, options, retryCount - 1);
            }

            if (error.name === 'AbortError') {
                const lang = await getLanguage();
                throw new Error(tStatic('timeoutError', lang));
            }


            if (error.message === 'Network request failed') {
                const lang = await getLanguage();
                throw new Error(tStatic('networkError', lang));
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
        changePassword: (data: any) => api.request<{ message: string }>('/api/user/change-password', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getPrivacy: () => api.request<{ isPrivate: boolean }>('/api/user/privacy'),
        updatePrivacy: (isPrivate: boolean) => api.request<{ success: boolean; isPrivate: boolean; is_private: boolean }>('/api/user/privacy', {
            method: 'PATCH',
            body: JSON.stringify({
                isPrivate,
                is_private: isPrivate // Send both for compatibility
            }),
        }),
    },

    user: {
        search: (q: string) => api.request<User[]>(`/api/user/search?q=${encodeURIComponent(q)}`),
        getPublicPortfolio: (username: string) => api.request<PublicPortfolio>(`/api/user/portfolio/${username}`),
    },

    books: {
        list: () => api.request<Book[]>('/api/books'),
        create: (data: CreateBook) => api.request<Book>('/api/books', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        updateDetails: (data: UpdateBook) => api.request<Book>('/api/books', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        updateStatus: (id: string, data: Partial<Book>) => api.request<Book>('/api/books', {
            method: 'PATCH',
            body: JSON.stringify({ ...data, userBookId: id }),
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
        updateDetails: (data: UpdateMovie) => api.request<Movie>('/api/movies', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        updateStatus: (id: string, data: Partial<Movie>) => api.request<Movie>('/api/movies', {
            method: 'PATCH',
            body: JSON.stringify({ ...data, userMovieId: id }),
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
        updateDetails: (data: UpdateSeries) => api.request<Series>('/api/series', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        updateStatus: (id: string, data: Partial<Series> & { seasonId?: string; seasonStatus?: string }) => api.request<Series>('/api/series', {
            method: 'PATCH',
            body: JSON.stringify({ ...data, userSeriesId: id }),
        }),
        delete: (id: string) => api.request(`/api/series?id=${id}`, {
            method: 'DELETE',
        }),
    },

    search: {
        books: (q: string) => api.request<Book[]>(`/api/search/books?q=${encodeURIComponent(q)}&limit=40`),
        movies: (q: string) => api.request<Movie[]>(`/api/search/movies?q=${encodeURIComponent(q)}&limit=40`),
        series: (q: string) => api.request<Series[]>(`/api/search/series?q=${encodeURIComponent(q)}&limit=40`),
    },

    utils: {
        optimizeImage: (url?: string) => {
            if (!url) return url;
            let finalUrl = url.trim();
            if (finalUrl.startsWith('//')) {
                finalUrl = `https:${finalUrl}`;
            }
            if (!finalUrl.startsWith('http')) return finalUrl;

            // MyAnimeList specific check: if original is already https://cdn.myanimelist.net
            // and it might be failing through the proxy, we'll keep it as is or try to clean it.
            // But wsrv.nl is usually best for bypassing MAL's referer protection on mobile.

            // Ensure we don't double proxy
            if (finalUrl.includes('wsrv.nl')) return finalUrl;

            // Use wsrv.nl to proxy and optimize images (bypasses CORS and referer checks)
            return `https://wsrv.nl/?url=${encodeURIComponent(finalUrl)}&w=400&q=80&output=webp`;
        }
    }
};
