import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPicker } from '@/components/ui/StatusPicker';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { MediaStatus } from '@/lib/types';
import { validateMedia } from '@/lib/validation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const STATUS_OPTIONS: { label: string; value: MediaStatus }[] = [
    { label: 'İstek Listesi', value: 'WISHLIST' },
    { label: 'İzleniyor', value: 'WATCHING' },
    { label: 'İzlendi', value: 'COMPLETED' },
    { label: 'Bırakıldı', value: 'DROPPED' },
];

export default function AddSeriesModal() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { show: showToast } = useToast();

    const [formData, setFormData] = useState({
        title: '',
        creator: '',
        coverImage: '',
        genre: '',
        totalSeasons: '',
        startYear: '',
        endYear: '',
        status: 'WATCHING' as MediaStatus,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: api.series.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['series'] });
            showToast('Dizi başarıyla eklendi', 'success');
            router.back();
        },
        onError: (e: any) => showToast(e.message || 'Dizi eklenemedi', 'error'),
    });

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length > 2) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const results = await api.search.series(searchQuery);
            setSearchResults(results.filter(s => s.coverImage || (s as any).imageUrl || (s as any).image));
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const selectResult = (item: any) => {
        setFormData(prev => ({
            ...prev,
            title: item.title || item.name || '',
            creator: item.creator || item.creatorName || item.yapimci || '',
            coverImage: item.coverImage || item.imageUrl || item.image || '',
            genre: item.genre || item.category || '',
            status: 'WISHLIST',
        }));
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleSubmit = () => {
        const newErrors = validateMedia(formData, 'series');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast('Lütfen zorunlu alanları doldurun', 'error');
            return;
        }

        setErrors({});
        const data = {
            ...formData,
            totalSeasons: formData.totalSeasons ? parseInt(formData.totalSeasons) : undefined,
            startYear: formData.startYear ? parseInt(formData.startYear) : undefined,
            endYear: formData.endYear ? parseInt(formData.endYear) : undefined,
        };
        mutation.mutate(data as any);
    };

    return (
        <ScrollView className="flex-1 bg-background px-6 pt-6">
            <View className="mb-6">
                <View className="relative">
                    <Input
                        placeholder="Dizi ara ve ekle..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="pr-12"
                    />
                    <View className="absolute right-4 top-1/2 -mt-2">
                        {isSearching ? <ActivityIndicator size="small" color="#9333ea" /> : <Search size={20} color="#64748b" />}
                    </View>
                </View>

                {searchResults.length > 0 && (
                    <View className="bg-slate-900 border border-slate-800 rounded-2xl mt-2 overflow-hidden shadow-2xl">
                        {searchResults.slice(0, 5).map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => selectResult(item)}
                                className="flex-row items-center p-3 border-b border-slate-800 active:bg-slate-800"
                            >
                                <Image
                                    source={{ uri: api.utils.optimizeImage(item.coverImage || item.imageUrl || item.image) }}
                                    className="w-10 h-14 rounded-md bg-slate-800"
                                />
                                <View className="ml-3 flex-1">
                                    <Text className="text-white font-bold text-sm" numberOfLines={1}>{item.title || item.name}</Text>
                                    <Text className="text-slate-400 text-xs" numberOfLines={1}>{item.creator || item.creatorName || item.yapimci || 'Yapımcı Belirtilmemiş'}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

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
                    label="Yapımcı/Yaratıcı *"
                    placeholder="Örn: Vince Gilligan"
                    value={formData.creator}
                    error={errors.creator}
                    onChangeText={(text: string) => {
                        setFormData(p => ({ ...p, creator: text }));
                        if (errors.creator) setErrors(p => ({ ...p, creator: '' }));
                    }}
                />
                <Input
                    label="Tür"
                    placeholder="Örn: Dram, Gerilim, Suç"
                    value={formData.genre}
                    onChangeText={(text: string) => setFormData(p => ({ ...p, genre: text }))}
                />

                <StatusPicker
                    label="İzleme Durumu"
                    options={STATUS_OPTIONS}
                    value={formData.status}
                    onChange={(status) => setFormData(p => ({ ...p, status }))}
                    color="cyan"
                />

                <Input
                    label="Toplam Sezon"
                    placeholder="Örn: 5"
                    value={formData.totalSeasons}
                    onChangeText={(text: string) => setFormData(p => ({ ...p, totalSeasons: text }))}
                    keyboardType="numeric"
                />

                <Input
                    label="Kapak Resmi URL"
                    placeholder="https://..."
                    value={formData.coverImage}
                    onChangeText={(text: string) => setFormData(p => ({ ...p, coverImage: text }))}
                />

                <Button
                    title="Diziyi Kaydet"
                    onPress={handleSubmit}
                    loading={mutation.isPending}
                    className="mt-4"
                />
            </View>
        </ScrollView>
    );
}
