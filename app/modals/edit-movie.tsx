import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPicker } from '@/components/ui/StatusPicker';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { MediaStatus, UpdateMovie } from '@/lib/types';
import { validateMedia } from '@/lib/validation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

export default function EditMovieModal() {
    const params = useLocalSearchParams();
    const id = params.id as string;
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

    const [dataLoaded, setDataLoaded] = useState(false);

    const { data: movies, isLoading } = useQuery({
        queryKey: ['movies'],
        queryFn: () => api.movies.list()
    });

    const [formData, setFormData] = useState({
        title: '',
        director: '',
        coverImage: '',
        description: '',
        genre: '',
        status: 'WATCHING' as MediaStatus,
        releaseYear: '',
        duration: '',
        movieId: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (movies && id && !dataLoaded) {
            let foundMovie = movies.find(m => String(m.id) === String(id)) ||
                movies.find(m => (m as any)._id === id);

            if (foundMovie) {
                const movieData = (foundMovie as any).movie || foundMovie;
                const userStatus = (foundMovie as any).overallStatus || foundMovie.status || 'WATCHING';
                const refId = (foundMovie as any).movieId || movieData.id || (movieData as any)._id;

                setFormData({
                    title: movieData.title || (movieData as any).name || '',
                    director: movieData.director || (movieData as any).yonetmen || '',
                    coverImage: movieData.coverImage || (movieData as any).image || (movieData as any).imageUrl || '',
                    genre: movieData.genre || (movieData as any).category || '',
                    status: userStatus as MediaStatus,
                    movieId: refId || '',
                    description: movieData.description || (movieData as any).summary || (movieData as any).aciklama || '',
                    releaseYear: movieData.releaseYear?.toString() || '',
                    duration: movieData.duration?.toString() || '',
                });
                setDataLoaded(true);
            }
        }
    }, [movies, id, dataLoaded]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (!formData.movieId) {
                throw new Error('Movie ID eksik.');
            }

            const updateData: UpdateMovie = {
                id: id,
                movieId: formData.movieId,
                title: formData.title,
                director: formData.director,
                coverImage: formData.coverImage,
                genre: formData.genre,
                status: formData.status,
            };
            return await api.movies.updateDetails(updateData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['movies'] });
            showToast(t('movieUpdated'), 'success');
            router.back();
        },
        onError: (e: any) => showToast(e.message || t('movieUpdateError'), 'error'),
    });

    const handleSubmit = () => {
        const newErrors = validateMedia(formData, 'movie');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast(t('fillRequired'), 'error');
            return;
        }

        setErrors({});
        mutation.mutate({});
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#a855f7" />
                <Text className="text-text-primary mt-4 font-medium">{t('loading')}</Text>
            </View>
        );
    }

    if (!id) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-red-500">{t('errorIdNotFound')}</Text>
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}
        >
            <View className="bg-background border border-border p-6 rounded-3xl mb-12 shadow-sm">
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
                    onChangeText={(text: string) => setFormData(p => ({ ...p, director: text }))}
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
                    title={t('saveChanges')}
                    onPress={handleSubmit}
                    loading={mutation.isPending}
                    className="mt-4"
                />
            </View>
        </ScrollView>
    );
}
