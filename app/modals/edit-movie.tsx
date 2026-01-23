import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPicker } from '@/components/ui/StatusPicker';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { MediaStatus } from '@/lib/types';
import { validateMedia } from '@/lib/validation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

const STATUS_OPTIONS: { label: string; value: MediaStatus }[] = [
    { label: 'İstek Listesi', value: 'WISHLIST' },
    { label: 'İzleniyor', value: 'WATCHING' },
    { label: 'Tamamlandı', value: 'COMPLETED' },
    { label: 'Bırakıldı', value: 'DROPPED' },
];

export default function EditMovieModal() {
    const params = useLocalSearchParams();
    const id = params.id as string;
    const router = useRouter();
    const queryClient = useQueryClient();
    const { show: showToast } = useToast();

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
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (movies && id && !dataLoaded) {
            console.log('=== EDIT MOVIE DEBUG ===');
            console.log('Received ID:', id);

            let foundMovie = movies.find(m => m.id === id);
            if (!foundMovie) {
                foundMovie = movies.find(m => String(m.id) === String(id));
            }

            console.log('Found movie:', foundMovie);

            if (foundMovie) {
                // Handle nested movie data structure
                const movieData = (foundMovie as any).movie || foundMovie;
                const userStatus = (foundMovie as any).overallStatus || foundMovie.status || 'WATCHING';
                const refId = (foundMovie as any).movieId || movieData.id;

                console.log('[EditMovie] Using movie data:', JSON.stringify(movieData).substring(0, 100));

                setFormData({
                    ...formData,
                    title: movieData.title || (movieData as any).name || '',
                    director: movieData.director || (movieData as any).yonetmen || '',
                    coverImage: movieData.coverImage || (movieData as any).image || (movieData as any).imageUrl || '',
                    genre: movieData.genre || (movieData as any).category || '',
                    status: userStatus as MediaStatus,
                    movieId: refId
                } as any);
                setDataLoaded(true);
            }
        }
    }, [movies, id, dataLoaded]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            console.log('[EditMovie] Update API broken, falling back to DELETE + CREATE strategy...');

            // 1. Delete existing record
            await api.movies.delete(id);

            // 2. Create new record
            const createData: any = {
                title: formData.title,
                name: formData.title,

                director: formData.director,
                directorName: formData.director,

                coverImage: formData.coverImage,
                imageUrl: formData.coverImage,
                image: formData.coverImage,

                genre: formData.genre,
                category: formData.genre,

                status: formData.status,
            };
            return await api.movies.create(createData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['movies'] });
            showToast('Film başarıyla güncellendi', 'success');
            router.back();
        },
        onError: (e: any) => showToast(e.message || 'Film güncellenemedi', 'error'),
    });

    const handleSubmit = () => {
        const newErrors = validateMedia(formData, 'movie');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast('Lütfen zorunlu alanları doldurun', 'error');
            return;
        }

        setErrors({});
        mutation.mutate({});
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#a855f7" />
                <Text className="text-white mt-4">Yükleniyor...</Text>
            </View>
        );
    }

    if (!id) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-red-500">Hata: ID bulunamadı</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-background px-6 pt-6">
            <View className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl mb-12">
                <Input
                    label="Film Adı *"
                    placeholder="Örn: Inception"
                    value={formData.title}
                    error={errors.title}
                    onChangeText={(text: string) => {
                        setFormData(p => ({ ...p, title: text }));
                        if (errors.title) setErrors(p => ({ ...p, title: '' }));
                    }}
                />
                <Input
                    label="Yönetmen"
                    placeholder="Örn: Christopher Nolan"
                    value={formData.director}
                    onChangeText={(text: string) => setFormData(p => ({ ...p, director: text }))}
                />

                <Input
                    label="Tür"
                    placeholder="Örn: Bilim Kurgu, Dram"
                    value={formData.genre}
                    onChangeText={(text: string) => setFormData(p => ({ ...p, genre: text }))}
                />

                <StatusPicker
                    label="İzleme Durumu"
                    options={STATUS_OPTIONS}
                    value={formData.status}
                    onChange={(status) => setFormData(p => ({ ...p, status }))}
                    color="blue"
                />

                <Input
                    label="Kapak Resmi URL"
                    placeholder="https://..."
                    value={formData.coverImage}
                    onChangeText={(text: string) => setFormData(p => ({ ...p, coverImage: text }))}
                />


                <Button
                    title="Değişiklikleri Kaydet"
                    onPress={handleSubmit}
                    loading={mutation.isPending}
                    className="mt-4"
                />
            </View>
        </ScrollView>
    );
}
