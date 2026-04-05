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

export default function AddBookModal() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { show: showToast } = useToast();
    const { t } = useLanguage();

    const STATUS_OPTIONS: { label: string; value: MediaStatus }[] = [
        { label: t('filterWishlist'), value: 'WISHLIST' },
        { label: t('filterReading'), value: 'READING' },
        { label: t('filterRead'), value: 'COMPLETED' },
        { label: t('filterDropped'), value: 'DROPPED' },
    ];

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        coverImage: '',
        description: '',
        genre: '',
        status: 'WISHLIST' as MediaStatus,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: api.books.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            showToast(t('bookAdded'), 'success');
            router.back();
        },
        onError: (e: any) => showToast(e.message || t('bookError'), 'error'),
    });

    const selectResult = (item: any) => {
        setFormData({
            title: item.title || item.name || '',
            author: item.author || item.writer || '',
            coverImage: item.coverImage || item.imageUrl || item.image || item.cover_image || item.image_url || '',
            description: item.description || item.summary || '',
            genre: item.genre || item.category || '',
            status: 'WISHLIST',
        });
    };

    const handleSubmit = () => {
        const newErrors = validateMedia(formData, 'book');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast(t('fillRequired'), 'error');
            return;
        }

        setErrors({});
        mutation.mutate(formData as any);
    };

    return (
        <View className="flex-1 bg-background pt-28">
            <View className="px-6 z-50">
                <SearchField
                    placeholder={t('searchPlaceholderBook')}
                    onSelect={selectResult}
                    searchFn={api.search.books}
                    getSubtitle={(item) => item.author || item.writer || t('noAuthor')}
                    iconColor="#10b981"
                />
            </View>

            <ScrollView className="flex-1 px-6 pt-2 mb-12" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
                    <Input
                        label={t('bookName')}
                        placeholder={t('placeholderBookName')}
                        value={formData.title}
                        error={errors.title}
                        onChangeText={(text: string) => {
                            setFormData(p => ({ ...p, title: text }));
                            if (errors.title) setErrors(p => ({ ...p, title: '' }));
                        }}
                    />
                    <Input
                        label={t('author')}
                        placeholder={t('placeholderAuthor')}
                        value={formData.author}
                        error={errors.author}
                        onChangeText={(text: string) => {
                            setFormData(p => ({ ...p, author: text }));
                            if (errors.author) setErrors(p => ({ ...p, author: '' }));
                        }}
                    />

                    <Input
                        label={t('genre')}
                        placeholder={t('placeholderGenreBook')}
                        value={formData.genre}
                        onChangeText={(text: string) => setFormData(p => ({ ...p, genre: text }))}
                    />
                    <StatusPicker
                        label={t('status')}
                        options={STATUS_OPTIONS}
                        value={formData.status}
                        onChange={(status) => setFormData(p => ({ ...p, status }))}
                        color="purple"
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
