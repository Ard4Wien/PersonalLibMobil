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
import { ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

export default function AddSeriesModal() {
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
        creator: '',
        coverImage: '',
        description: '',
        genre: '',
        totalSeasons: '',
        lastSeason: '',
        lastEpisode: '',
        startYear: '',
        endYear: '',
        status: 'WATCHING' as MediaStatus,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: api.series.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['series'] });
            showToast(t('seriesAdded'), 'success');
            router.back();
        },
        onError: (e: any) => showToast(e.message || t('seriesError'), 'error'),
    });

    const selectResult = (item: any) => {
        setFormData(prev => ({
            ...prev,
            title: item.title || item.name || item.baslik || '',
            creator: item.creator || item.yapimci || item.writer || '',
            coverImage: item.coverImage || item.imageUrl || item.image || item.cover_image || item.image_url || '',
            description: item.description || item.summary || item.aciklama || '',
            genre: item.genre || item.category || '',
            totalSeasons: item.totalSeasons?.toString() || '',
            startYear: item.startYear?.toString() || '',
            endYear: item.endYear?.toString() || '',
            status: 'WATCHING' as MediaStatus,
        }));
    };

    const handleSubmit = () => {
        const newErrors = validateMedia(formData, 'series');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast(t('fillRequired'), 'error');
            return;
        }

        setErrors({});
        const payload = {
            ...formData,
            totalSeasons: formData.totalSeasons ? parseInt(formData.totalSeasons) : undefined,
            lastSeason: formData.lastSeason ? parseInt(formData.lastSeason) : undefined,
            lastEpisode: formData.lastEpisode ? parseInt(formData.lastEpisode) : undefined,
            startYear: formData.startYear ? parseInt(formData.startYear) : undefined,
            endYear: formData.endYear ? parseInt(formData.endYear) : undefined,
        };
        mutation.mutate(payload as any);
    };

    const handleIncrement = (field: 'lastSeason' | 'lastEpisode') => {
        const current = parseInt(formData[field]) || 0;
        setFormData(p => ({ ...p, [field]: (current + 1).toString() }));
    };

    return (
        <View className="flex-1 bg-background pt-28">
            <View className="px-6 z-50">
                <SearchField
                    placeholder={t('searchPlaceholderSeries')}
                    onSelect={selectResult}
                    searchFn={api.search.series}
                    getSubtitle={(item) => item.creator || item.yapimci || item.creatorName || t('noCreator')}
                    iconColor="#06b6d4"
                />
            </View>

            <ScrollView className="flex-1 px-6 pt-2 mb-12" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
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
                            placeholder={t('placeholderUrl')}
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
                        color="blue"
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
                                        className="bg-slate-800 p-2 rounded-lg active:bg-slate-700"
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
                                        className="bg-slate-800 p-2 rounded-lg active:bg-slate-700"
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
