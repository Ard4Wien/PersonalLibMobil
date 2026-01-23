export const validateMedia = (data: any, type: 'book' | 'movie' | 'series'): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Common validations
    if (!data.title?.trim()) {
        errors.title = `${type === 'book' ? 'Kitap' : type === 'movie' ? 'Film' : 'Dizi'} adı zorunludur`;
    }

    if (type === 'book' && !data.author?.trim()) {
        errors.author = 'Yazar ismi zorunludur';
    }

    if (type === 'movie' && !data.director?.trim()) {
        errors.director = 'Yönetmen ismi zorunludur';
    }

    if (type === 'series' && !data.creator?.trim()) {
        errors.creator = 'Yapımcı/Yaratıcı ismi zorunludur';
    }

    // URL validation for cover image
    if (data.coverImage && !data.coverImage.startsWith('http')) {
        errors.coverImage = 'Geçerli bir URL girmelisiniz (http... ile başlayan)';
    }

    return errors;
};
