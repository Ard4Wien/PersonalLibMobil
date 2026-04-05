export type MediaStatus = 'WISHLIST' | 'READING' | 'WATCHING' | 'COMPLETED' | 'DROPPED';

export interface User {
    id: string;
    email: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isPrivate?: boolean;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    coverImage?: string;
    description?: string;
    pageCount?: number;
    isbn?: string;
    genre?: string;
    status: MediaStatus;
    rating?: number;
    isFavorite?: boolean;
    // Fallbacks for backend compatibility
    name?: string;
    baslik?: string;
    writer?: string;
    yazar?: string;
    image?: string;
    imageUrl?: string;
    cover_image?: string;
    summary?: string;
    aciklama?: string;
    category?: string;
}

export interface Movie {
    id: string;
    title: string;
    director: string;
    coverImage?: string;
    releaseYear?: number;
    duration?: number;
    imdbId?: string;
    genre?: string;
    status: MediaStatus;
    rating?: number;
    isFavorite?: boolean;
    // Fallbacks for backend compatibility
    name?: string;
    baslik?: string;
    yonetmen?: string;
    directorName?: string;
    image?: string;
    imageUrl?: string;
    cover_image?: string;
    summary?: string;
    aciklama?: string;
    description?: string;
    category?: string;
}

export interface Series {
    id: string;
    title: string;
    creator: string;
    coverImage?: string;
    totalSeasons?: number;
    startYear?: number;
    endYear?: number;
    genre?: string;
    lastSeason?: number;
    lastEpisode?: number;
    status: MediaStatus;
    rating?: number;
    isFavorite?: boolean;
    // Fallbacks for backend compatibility
    name?: string;
    baslik?: string;
    yapimci?: string;
    creatorName?: string;
    writer?: string;
    image?: string;
    imageUrl?: string;
    cover_image?: string;
    summary?: string;
    aciklama?: string;
    description?: string;
    category?: string;
}

export type CreateBook = Omit<Book, 'id'>;
export type UpdateBook = Partial<CreateBook> & { id: string; bookId?: string };

export type CreateMovie = Omit<Movie, 'id'>;
export type UpdateMovie = Partial<CreateMovie> & { id: string; movieId?: string };

export type CreateSeries = Omit<Series, 'id'>;
export type UpdateSeries = Partial<CreateSeries> & { id: string; seriesId?: string };
