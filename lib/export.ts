import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { api } from './api';
import { getLanguage, tStatic } from './i18n';

/**
 * Removes internal IDs, developer fallbacks and redundant fields for a clean export.
 */
const cleanItem = (item: any) => {
    // Whitelist: Only explicitly allowed fields will be exported
    const allowedFields = [
        'title', 'name', 'baslik', 'ad', 'isim', 'label', // Titles
        'author', 'writer', 'yazar', 'Artist', 'Author', // Authors
        'director', 'yonetmen', 'Director', // Directors
        'creator', 'yapimci', 'Creator', // Creators
        'status', 'Status', 'durum', 'Durum', 'overallStatus', // Statuses
        'genre', 'category', 'type', // Metadata
        'coverImage', 'imageUrl', 'image', 'cover_image', 'thumbnail', 'poster', // Images
        'lastSeason', 'lastEpisode', 'totalSeasons', 'progress', // Progress
        'isFavorite', 'favorite', 'rating', 'score' // User specific
    ];

    const cleaned: any = {};
    allowedFields.forEach(key => {
        if (item[key] !== undefined && item[key] !== null) {
            cleaned[key] = item[key];
        }
    });

    return cleaned;
};

/**
 * Fetches all library data and triggers a system share/save dialog for a JSON file.
 */
export const exportLibraryData = async () => {
    try {
        const [books, movies, series] = await Promise.all([
            api.books.list(),
            api.movies.list(),
            api.series.list()
        ]);

        const exportData = {
            exportDate: new Date().toISOString(),
            appVersion: '1.2.0',
            data: {
                books: (books || []).map(cleanItem),
                movies: (movies || []).map(cleanItem),
                series: (series || []).map(cleanItem)
            }
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const fileName = `personal-lib-backup-${new Date().getTime()}.json`;

        const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        const fileUri = `${cacheDir}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, jsonString, {
            encoding: (FileSystem.EncodingType as any)?.UTF8 || 'utf8'
        });

        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
            const lang = await getLanguage();
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/json',
                dialogTitle: tStatic('exportTxt', lang),
                UTI: 'public.json'
            });
        } else {
            const lang = await getLanguage();
            throw new Error(tStatic('error', lang));
        }

        return true;
    } catch (error) {
        console.error('Export Error:', error);
        throw error;
    }
};

const findValue = (obj: any, keys: string[]) => {
    if (!obj) return undefined;
    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
    }
    const wrappers = ['attributes', 'data', 'book', 'item', 'media', 'movie', 'series', 'content'];
    for (const wrapper of wrappers) {
        if (obj[wrapper] && typeof obj[wrapper] === 'object') {
            for (const key of keys) {
                if (obj[wrapper][key] !== undefined && obj[wrapper][key] !== null && obj[wrapper][key] !== '') {
                    return obj[wrapper][key];
                }
            }
        }
    }
    return undefined;
};

/**
 * Fetches all library data and triggers a system share/save dialog for a TXT file.
 */
export const exportLibraryAsText = async () => {
    try {
        const [books, movies, series, lang] = await Promise.all([
            api.books.list(),
            api.movies.list(),
            api.series.list(),
            getLanguage()
        ]);

        const statusMap: Record<string, string> = {
            'WISHLIST': tStatic('statusWishlist', lang),
            'READING': tStatic('statusReading', lang),
            'WATCHING': tStatic('statusWatching', lang),
            'COMPLETED': tStatic('statusCompleted', lang),
            'DROPPED': tStatic('statusDropped', lang)
        };

        const getStatus = (item: any) => {
            const raw = findValue(item, ['status', 'Status', 'durum', 'Durum', 'overallStatus']);
            return typeof raw === 'string' ? raw.toUpperCase() : raw;
        };

        const dateStr = new Date().toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US');
        let text = `${tStatic('exportTitle', lang)}\n${tStatic('exportDateLabel', lang)}: ${dateStr}\n\n`;

        // 1. KİTAPLAR
        text += `==============================\n`;
        text += `${tStatic('exportBooks', lang)}\n`;
        text += `==============================\n`;
        const activeBooks = (books || []).filter(b => getStatus(b) !== 'WISHLIST');
        if (activeBooks.length === 0) text += `${tStatic('exportNoData', lang)}\n`;
        activeBooks.forEach(b => {
            const title = findValue(b, ['title', 'name', 'baslik', 'ad', 'isim', 'label']);
            const author = findValue(b, ['author', 'writer', 'yazar', 'Artist', 'Author']);
            const status = getStatus(b);
            const image = findValue(b, ['coverImage', 'imageUrl', 'image', 'cover_image', 'cover', 'thumbnail', 'poster']);

            text += `- ${title || tStatic('untitled', lang)}\n`;
            text += `  ${tStatic('author', lang).replace(' *', '')}: ${author || tStatic('noAuthor', lang)}\n`;
            text += `  ${tStatic('status', lang)}: ${statusMap[status] || status || tStatic('noData', lang)}\n`;
            if (image) text += `  ${tStatic('exportImage', lang)}: ${image}\n`;
            text += `\n`;
        });

        // 2. FİLMLER
        text += `\n==============================\n`;
        text += `${tStatic('exportMovies', lang)}\n`;
        text += `==============================\n`;
        const activeMovies = (movies || []).filter(m => getStatus(m) !== 'WISHLIST');
        if (activeMovies.length === 0) text += `${tStatic('exportNoData', lang)}\n`;
        activeMovies.forEach(m => {
            const title = findValue(m, ['title', 'name', 'baslik', 'ad', 'isim', 'label']);
            const director = findValue(m, ['director', 'yonetmen', 'Director']);
            const status = getStatus(m);
            const image = findValue(m, ['coverImage', 'imageUrl', 'image', 'cover_image', 'cover', 'thumbnail', 'poster']);

            text += `- ${title || tStatic('untitled', lang)}\n`;
            text += `  ${tStatic('director', lang).replace(' *', '')}: ${director || tStatic('noDirector', lang)}\n`;
            text += `  ${tStatic('status', lang)}: ${statusMap[status] || status || tStatic('noData', lang)}\n`;
            if (image) text += `  ${tStatic('exportImage', lang)}: ${image}\n`;
            text += `\n`;
        });

        // 3. DİZİLER
        text += `\n==============================\n`;
        text += `${tStatic('exportSeries', lang)}\n`;
        text += `==============================\n`;
        const activeSeries = (series || []).filter(s => getStatus(s) !== 'WISHLIST');
        if (activeSeries.length === 0) text += `${tStatic('exportNoData', lang)}\n`;
        activeSeries.forEach(s => {
            const title = findValue(s, ['title', 'name', 'baslik', 'ad', 'isim', 'label']);
            const creator = findValue(s, ['creator', 'yapimci', 'Creator', 'Writer']);
            const status = getStatus(s);
            const image = findValue(s, ['coverImage', 'imageUrl', 'image', 'cover_image', 'cover', 'thumbnail', 'poster']);
            const lastSeason = findValue(s, ['lastSeason']);
            const lastEpisode = findValue(s, ['lastEpisode']);

            text += `- ${title || tStatic('untitled', lang)}\n`;
            text += `  ${tStatic('creator', lang)}: ${creator || tStatic('noCreator', lang)}\n`;
            text += `  ${tStatic('status', lang)}: ${statusMap[status] || status || tStatic('noData', lang)}\n`;
            if (lastSeason || lastEpisode) {
                text += `  ${tStatic('exportProgress', lang)}: ${lastSeason || 1}. ${tStatic('lastSeason', lang)}, ${lastEpisode || 0}. ${tStatic('lastEpisode', lang)}\n`;
            }
            if (image) text += `  ${tStatic('exportImage', lang)}: ${image}\n`;
            text += `\n`;
        });

        // 4. İSTEK LİSTESİ
        text += `\n==============================\n`;
        text += `${tStatic('exportWishlist', lang)}\n`;
        text += `==============================\n`;
        const wishlistItems = [
            ...(books || []).filter(i => getStatus(i) === 'WISHLIST').map(i => ({ ...i, type: tStatic('book', lang) })),
            ...(movies || []).filter(i => getStatus(i) === 'WISHLIST').map(i => ({ ...i, type: tStatic('movie', lang) })),
            ...(series || []).filter(i => getStatus(i) === 'WISHLIST').map(i => ({ ...i, type: tStatic('series', lang) }))
        ];

        if (wishlistItems.length === 0) text += `${tStatic('emptyWishlist', lang)}.\n`;
        wishlistItems.forEach((i: any) => {
            const title = findValue(i, ['title', 'name', 'baslik', 'ad', 'isim', 'label']);
            const creator = findValue(i, [
                'author', 'writer', 'yazar', 'director', 'yonetmen', 'creator', 'yapimci',
                'Artist', 'Author', 'Director', 'Creator'
            ]);
            const image = findValue(i, ['coverImage', 'imageUrl', 'image', 'cover_image', 'cover', 'thumbnail', 'poster']);

            text += `- [${i.type}] ${title || tStatic('untitled', lang)}\n`;
            if (creator) text += `  ${tStatic('exportDetail', lang)}: ${creator}\n`;
            if (image) text += `  ${tStatic('exportImage', lang)}: ${image}\n`;
            text += `\n`;
        });

        const fileName = `personal-lib-text-backup-${new Date().getTime()}.txt`;
        const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        const fileUri = `${cacheDir}${fileName}`;

        const finalText = '\uFEFF' + text;

        await FileSystem.writeAsStringAsync(fileUri, finalText, {
            encoding: 'utf8' as any
        });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/plain',
                dialogTitle: tStatic('exportTxt', lang),
                UTI: 'public.plain-text'
            });
        }

        return true;
    } catch (error) {
        console.error('Text Export Error:', error);
        throw error;
    }
};
