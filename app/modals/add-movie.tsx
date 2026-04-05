import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SearchField } from '@/components/ui/SearchField';
import { StatusPicker } from '@/components/ui/StatusPicker';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { MediaStatus } from '@/lib/types';
import { validateMedia } from '@/lib/validation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';


export default function AddMovieModal() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { show: showToast } = useToast();
    const { t } = useLanguage();

    const STATUS_OPTIONS: { label: string; value: MediaStatus }[] = [
        { label: t('filterWishlist'), value: 'WISHLIST' },
        { label: t('statusWatching'), value: 'WATCHING' },
        { label: t('statusCompleted'), value: 'COMPLETED' },
        { label: t('filterDropped'), value: 'DROPPED' },
    ];

    const [formData, setFormData] = useState({
        title: '',
        director: '',
        coverImage: '',
        genre: '',
        releaseYear: '',
        duration: '',
        imdbId: '',
        status: 'WATCHING' as MediaStatus,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: api.movies.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['movies'] });
            showToast(t('movieAdded'), 'success');
            router.back();
        },
        onError: (e: any) => showToast(e.message || t('movieError'), 'error'),
    });

    const selectResult = (item: any) => {
        setFormData(prev => ({
            ...prev,
            title: item.title || item.name || '',
            director: item.director || item.directorName || item.yonetmen || '',
            coverImage: item.coverImage || item.imageUrl || item.image || item.cover_image || item.image_url || '',
            genre: item.genre || item.category || '',
            status: 'WISHLIST',
        }));
    };

    const handleSubmit = () => {
        const newErrors = validateMedia(formData, 'movie');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast(t('fillRequired'), 'error');
            return;
        }

        setErrors({});
        const data = {
            ...formData,
            releaseYear: formData.releaseYear ? parseInt(formData.releaseYear) : undefined,
            duration: formData.duration ? parseInt(formData.duration) : undefined,
        };
        mutation.mutate(data as any);
    };

    return (
        <View className="flex-1 bg-background pt-28">
            <View className="px-6 z-50">
                <SearchField
                    placeholder={t('searchPlaceholderMovie')}
                    onSelect={selectResult}
                    searchFn={api.search.movies}
                    getSubtitle={(item) => item.director || item.directorName || item.yonetmen || t('noDirector')}
                    iconColor="#3b82f6"
                />
            </View>

            <ScrollView className="flex-1 px-6 pt-2 mb-12" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>

                <View className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
                    <Input
                        label={t('movieName')}
                        placeholder={t('placeholderMovieName')}
                        value={formData.title}
                        error={errors.title}
                        onChangeText={(text: string) => {
                            setFormData(p => ({ ...p, title: text }));
                            if (errors.title) setErrors(p => ({ ...p, title: '' }));
                        }}
                    />
                    <Input
                        label={t('director')}
                        placeholder={t('placeholderDirector')}
                        value={formData.director}
                        error={errors.director}
                        onChangeText={(text: string) => {
                            setFormData(p => ({ ...p, director: text }));
                            if (errors.director) setErrors(p => ({ ...p, director: '' }));
                        }}
                    />

                    <Input
                        label={t('genre')}
                        placeholder={t('placeholderGenreMovie')}
                        value={formData.genre}
                        onChangeText={(text: string) => setFormData(p => ({ ...p, genre: text }))}
                    />
                    <StatusPicker
                        label={t('status')}
                        options={STATUS_OPTIONS}
                        value={formData.status}
                        onChange={(status) => setFormData(p => ({ ...p, status }))}
                        color="blue"
                    />

                    <Input
                        label={t('imageUrl')}
                        placeholder={t('placeholderUrl')}
                        value={formData.coverImage}
                        error={errors.coverImage}
                        onChangeText={(text: string) => {
                            setFormData(p => ({ ...p, coverImage: text }));
                            if (errors.coverImage) setErrors(p => ({ ...p, coverImage: '' }));
                        }}
                    />

                    <Button
                        title={t('save')}
                        onPress={handleSubmit}
                        loading={mutation.isPending}
                        className="mt-4"
                    />
                </View>
            </ScrollView>
        </View>
    );
}
