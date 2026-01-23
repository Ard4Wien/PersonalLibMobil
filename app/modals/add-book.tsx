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
    { label: 'Okunuyor', value: 'READING' },
    { label: 'Okundu', value: 'COMPLETED' },
    { label: 'Bırakıldı', value: 'DROPPED' },
];

export default function AddBookModal() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { show: showToast } = useToast();

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        coverImage: '',
        description: '',
        genre: '',
        status: 'WISHLIST' as MediaStatus,
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: api.books.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            showToast('Kitap başarıyla eklendi', 'success');
            router.back();
        },
        onError: (e: any) => showToast(e.message || 'Kitap eklenemedi', 'error'),
    });

    // ... internal implementation ...

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
            const results = await api.search.books(searchQuery);
            // Filter out results without cover image as requested
            setSearchResults(results.filter(b => b.coverImage || (b as any).imageUrl || (b as any).image));
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const selectResult = (item: any) => {
        setFormData({
            title: item.title || item.name || '',
            author: item.author || item.writer || '',
            coverImage: item.coverImage || item.imageUrl || item.image || '',
            description: item.description || item.summary || '',
            genre: item.genre || item.category || '',
            status: 'WISHLIST',
        });
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleSubmit = () => {
        const newErrors = validateMedia(formData, 'book');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast('Lütfen zorunlu alanları doldurun', 'error');
            return;
        }

        setErrors({});
        // Payload preparation is now handled centrally in api.ts
        mutation.mutate(formData as any);
    };

    return (
        <ScrollView className="flex-1 bg-background px-6 pt-6">
            <View className="mb-6">
                <View className="relative">
                    <Input
                        placeholder="Hızlıca ara ve ekle..."
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
                                    <Text className="text-slate-400 text-xs" numberOfLines={1}>{item.author || item.writer}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <View className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl mb-12">
                <Input
                    label="Kitap Adı *"
                    placeholder="Örn: Suç ve Ceza"
                    value={formData.title}
                    error={errors.title}
                    onChangeText={(text: string) => {
                        setFormData(p => ({ ...p, title: text }));
                        if (errors.title) setErrors(p => ({ ...p, title: '' }));
                    }}
                />
                <Input
                    label="Yazar *"
                    placeholder="Örn: Dostoyevski"
                    value={formData.author}
                    error={errors.author}
                    onChangeText={(text: string) => {
                        setFormData(p => ({ ...p, author: text }));
                        if (errors.author) setErrors(p => ({ ...p, author: '' }));
                    }}
                />
                <Input
                    label="Tür"
                    placeholder="Örn: Roman, Bilim Kurgu, Tarih"
                    value={formData.genre}
                    onChangeText={(text: string) => setFormData(p => ({ ...p, genre: text }))}
                />

                <StatusPicker
                    label="Kütüphane Durumu"
                    options={STATUS_OPTIONS}
                    value={formData.status}
                    onChange={(status) => setFormData(p => ({ ...p, status }))}
                    color="purple"
                />

                <Input
                    label="Kapak Resmi URL"
                    placeholder="https://..."
                    value={formData.coverImage}
                    onChangeText={(text: string) => setFormData(p => ({ ...p, coverImage: text }))}
                />


                <Button
                    title="Kitabı Kaydet"
                    onPress={handleSubmit}
                    loading={mutation.isPending}
                    className="mt-4"
                />
            </View>
        </ScrollView>
    );
}
