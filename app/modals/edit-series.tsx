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

export default function EditSeriesModal() {
    const params = useLocalSearchParams();
    const id = params.id as string;
    const router = useRouter();
    const queryClient = useQueryClient();
    const { show: showToast } = useToast();

    // State for tracking if data was loaded
    const [dataLoaded, setDataLoaded] = useState(false);

    const { data: seriesList, isLoading } = useQuery({
        queryKey: ['series'],
        queryFn: () => api.series.list()
    });

    const [formData, setFormData] = useState({
        title: '',
        creator: '',
        coverImage: '',
        description: '',
        genre: '',
        status: 'WATCHING' as MediaStatus,
        totalSeasons: '',
        startYear: '',
        endYear: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Find the series when data is available
    useEffect(() => {
        if (seriesList && id && !dataLoaded) {
            console.log('=== EDIT SERIES DEBUG ===');
            console.log('Received ID:', id);
            console.log('Series list:', JSON.stringify(seriesList, null, 2));

            // Try multiple matching strategies
            let foundSeries = seriesList.find(s => s.id === id);

            if (!foundSeries) {
                foundSeries = seriesList.find(s => String(s.id) === String(id));
            }

            if (!foundSeries) {
                foundSeries = seriesList.find(s => (s as any)._id === id);
            }

            console.log('Found series:', foundSeries);

            if (foundSeries) {
                // Handle nested series data structure (UserSeries vs Series)
                const seriesData = foundSeries.series || foundSeries;
                const userStatus = foundSeries.overallStatus || foundSeries.status || 'WATCHING';
                const refId = (foundSeries as any).seriesId || seriesData.id;

                console.log('[EditSeries] Using series data:', JSON.stringify(seriesData).substring(0, 100));

                setFormData({
                    ...formData,
                    title: seriesData.title || (seriesData as any).name || '',
                    creator: seriesData.creator || (seriesData as any).yapimci || (seriesData as any).creatorName || '',
                    coverImage: seriesData.coverImage || (seriesData as any).image || (seriesData as any).imageUrl || '',
                    description: seriesData.description || (seriesData as any).summary || (seriesData as any).aciklama || '',
                    genre: seriesData.genre || (seriesData as any).category || '',
                    status: userStatus as MediaStatus,
                    totalSeasons: seriesData.totalSeasons?.toString() || '',
                    // startYear and endYear previously removed from UI, but maybe keep in state if backend expects
                    startYear: seriesData.startYear?.toString() || '',
                    endYear: seriesData.endYear?.toString() || '',
                    seriesId: refId
                } as any);
                setDataLoaded(true);
                console.log('Form data set successfully!');
            } else {
                console.log('Series NOT FOUND with id:', id);
            }
        }
    }, [seriesList, id, dataLoaded]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            console.log('[EditSeries] Update API broken, falling back to DELETE + CREATE strategy...');

            // 1. Delete existing record
            await api.series.delete(id);

            // 2. Create new record
            const createData: any = {
                title: formData.title,
                name: formData.title,

                creator: formData.creator,
                creatorName: formData.creator,

                coverImage: formData.coverImage,
                imageUrl: formData.coverImage,
                image: formData.coverImage,

                genre: formData.genre,
                category: formData.genre,

                status: formData.status,
                totalSeasons: formData.totalSeasons ? parseInt(formData.totalSeasons) : undefined,
            };
            return await api.series.create(createData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['series'] });
            showToast('Dizi başarıyla güncellendi', 'success');
            router.back();
        },
        onError: (e: any) => showToast(e.message || 'Dizi güncellenemedi', 'error'),
    });

    const handleSubmit = () => {
        const newErrors = validateMedia(formData, 'series');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast('Lütfen zorunlu alanları doldurun', 'error');
            return;
        }

        setErrors({});
        // Numeric conversions should still be explicit if passed in a blank object (though here mutate({}) relies on closure)
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
                    label="Dizi Adı *"
                    placeholder="Örn: Breaking Bad"
                    value={formData.title}
                    error={errors.title}
                    onChangeText={(text: string) => {
                        setFormData(p => ({ ...p, title: text }));
                        if (errors.title) setErrors(p => ({ ...p, title: '' }));
                    }}
                />
                <Input
                    label="Yapımcı/Yaratıcı"
                    placeholder="Örn: Vince Gilligan"
                    value={formData.creator}
                    onChangeText={(text: string) => setFormData(p => ({ ...p, creator: text }))}
                />
                <Input
                    label="Toplam Sezon"
                    placeholder="Örn: 5"
                    value={formData.totalSeasons}
                    keyboardType="numeric"
                    onChangeText={(text: string) => setFormData(p => ({ ...p, totalSeasons: text }))}
                />

                <Input
                    label="Tür"
                    placeholder="Örn: Dram, Suç"
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
