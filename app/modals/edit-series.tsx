import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPicker } from '@/components/ui/StatusPicker';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { MediaStatus, UpdateSeries } from '@/lib/types';
import { validateMedia } from '@/lib/validation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function EditSeriesModal() {
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
        lastSeason: '',
        lastEpisode: '',
        startYear: '',
        endYear: '',
        seriesId: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (seriesList && id && !dataLoaded) {
            let foundSeries = seriesList.find(s => String(s.id) === String(id)) ||
                seriesList.find(s => (s as any)._id === id);

            if (foundSeries) {
                const seriesData = (foundSeries as any).series || foundSeries;
                const userStatus = (foundSeries as any).overallStatus || (foundSeries as any).status || 'WATCHING';
                const refId = (foundSeries as any).seriesId || seriesData.id || (seriesData as any)._id;

                setFormData({
                    title: seriesData.title || (seriesData as any).name || '',
                    creator: seriesData.creator || (seriesData as any).yapimci || (seriesData as any).creatorName || '',
                    coverImage: seriesData.coverImage || (seriesData as any).image || (seriesData as any).imageUrl || '',
                    description: seriesData.description || (seriesData as any).summary || (seriesData as any).aciklama || '',
                    genre: seriesData.genre || (seriesData as any).category || '',
                    status: userStatus as MediaStatus,
                    totalSeasons: seriesData.totalSeasons?.toString() || '',
                    lastSeason: (foundSeries as any).lastSeason?.toString() || '',
                    lastEpisode: (foundSeries as any).lastEpisode?.toString() || '',
                    startYear: seriesData.startYear?.toString() || '',
                    endYear: seriesData.endYear?.toString() || '',
                    seriesId: refId || ''
                });
                setDataLoaded(true);
            }
        }
    }, [seriesList, id, dataLoaded]);

    const mutation = useMutation({
        mutationFn: async () => {
            if (!formData.seriesId) {
                throw new Error('Series ID eksik.');
            }

            const updateData: UpdateSeries = {
                id: id,
                seriesId: formData.seriesId,
                title: formData.title,
                creator: formData.creator,
                coverImage: formData.coverImage,
                genre: formData.genre,
                status: formData.status,
                totalSeasons: formData.totalSeasons ? parseInt(formData.totalSeasons) : undefined,
                lastSeason: formData.lastSeason ? parseInt(formData.lastSeason) : undefined,
                lastEpisode: formData.lastEpisode ? parseInt(formData.lastEpisode) : undefined,
            };

            return await api.series.updateDetails(updateData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['series'] });
            showToast(t('seriesUpdated'), 'success');
            router.back();
        },
        onError: (e: any) => showToast(e.message || t('seriesUpdateError'), 'error'),
    });

    const handleIncrement = (field: 'lastSeason' | 'lastEpisode') => {
        const current = parseInt(formData[field]) || 0;
        setFormData(p => ({ ...p, [field]: (current + 1).toString() }));
    };

    const handleSubmit = () => {
        const newErrors = validateMedia(formData, 'series');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast(t('fillRequired'), 'error');
            return;
        }

        setErrors({});
        mutation.mutate();
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
                <Text className="text-red-500 font-bold">{t('errorIdNotFound')}</Text>
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
                    label={t('seriesName')}
                    placeholder={t('placeholderSeriesName')}
                    value={formData.title}
                    error={errors.title}
                    onChangeText={(text: string) => {
                        setFormData(p => ({ ...p, title: text }));
                        if (errors.title) setErrors(p => ({ ...p, title: '' }));
                    }}
                />
                <Input
                    label={t('creator')}
                    placeholder={t('placeholderCreator')}
                    value={formData.creator}
                    onChangeText={(text: string) => setFormData(p => ({ ...p, creator: text }))}
                />

                <View className="flex-row space-x-3">
                    <Input
                        label={t('totalSeasons')}
                        placeholder="0"
                        value={formData.totalSeasons}
                        keyboardType="numeric"
                        containerStyle="flex-1"
                        onChangeText={(text: string) => setFormData(p => ({ ...p, totalSeasons: text }))}
                    />
                    <Input
                        label={t('genre')}
                        placeholder={t('placeholderGenreSeries')}
                        value={formData.genre}
                        containerStyle="flex-1"
                        onChangeText={(text: string) => setFormData(p => ({ ...p, genre: text }))}
                    />
                </View>

                <StatusPicker
                    label={t('status')}
                    options={STATUS_OPTIONS}
                    value={formData.status}
                    onChange={(status) => setFormData(p => ({ ...p, status }))}
                    color="cyan"
                />

                {formData.status === 'WATCHING' && (
                    <View className="flex-row space-x-3 mt-2">
                        <Input
                            label={t('lastSeason')}
                            placeholder="0"
                            value={formData.lastSeason}
                            keyboardType="numeric"
                            containerStyle="flex-1"
                            onChangeText={(text: string) => setFormData(p => ({ ...p, lastSeason: text }))}
                            rightElement={
                                <TouchableOpacity
                                    onPress={() => handleIncrement('lastSeason')}
                                    className="bg-surface-light p-2 rounded-lg active:bg-slate-400/20"
                                >
                                    <ChevronUp size={16} color="#06b6d4" />
                                </TouchableOpacity>
                            }
                        />
                        <Input
                            label={t('lastEpisode')}
                            placeholder="0"
                            value={formData.lastEpisode}
                            keyboardType="numeric"
                            containerStyle="flex-1"
                            onChangeText={(text: string) => setFormData(p => ({ ...p, lastEpisode: text }))}
                            rightElement={
                                <TouchableOpacity
                                    onPress={() => handleIncrement('lastEpisode')}
                                    className="bg-surface-light p-2 rounded-lg active:bg-slate-400/20"
                                >
                                    <ChevronUp size={16} color="#06b6d4" />
                                </TouchableOpacity>
                            }
                        />
                    </View>
                )}

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
