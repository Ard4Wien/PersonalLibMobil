import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPicker } from '@/components/ui/StatusPicker';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { MediaStatus, UpdateBook } from '@/lib/types';
import { validateMedia } from '@/lib/validation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

export default function EditBookModal() {
    const params = useLocalSearchParams();
    const id = params.id as string;
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

    const [dataLoaded, setDataLoaded] = useState(false);

    const { data: books, isLoading } = useQuery({
        queryKey: ['books'],
        queryFn: () => api.books.list()
    });

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        coverImage: '',
        description: '',
        genre: '',
        status: 'READING' as MediaStatus,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (books && id && !dataLoaded) {
            const foundBook = books.find(b => {
                const itemId = String(b.id || (b as any)._id || '');
                const paramId = String(id || '');
                return itemId === paramId;
            });

            if (foundBook) {
                const bookData = (foundBook as any).book || foundBook;
                const userStatus = (foundBook as any).overallStatus || foundBook.status || 'READING';
                const refId = (foundBook as any).bookId || bookData.id;

                setFormData({
                    ...formData,
                    title: bookData.title || (bookData as any).name || '',
                    author: bookData.author || (bookData as any).writer || '',
                    coverImage: bookData.coverImage || (bookData as any).image || (bookData as any).imageUrl || '',
                    genre: bookData.genre || (bookData as any).category || '',
                    status: userStatus as MediaStatus,
                    bookId: refId
                } as any);
                setDataLoaded(true);
            }
        }
    }, [books, id, dataLoaded]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const updateData: UpdateBook = {
                id: id,
                title: formData.title,
                author: formData.author,
                coverImage: formData.coverImage,
                genre: formData.genre,
                status: formData.status,
                bookId: (formData as any).bookId,
            };

            return await api.books.updateDetails(updateData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            showToast(t('bookUpdated'), 'success');
            router.back();
        },
        onError: (e: any) => showToast(e.message || t('bookUpdateError'), 'error'),
    });

    const handleSubmit = () => {
        const newErrors = validateMedia(formData, 'book');

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
                    title={t('saveChanges')}
                    onPress={handleSubmit}
                    loading={mutation.isPending}
                    className="mt-4"
                />
            </View>
        </ScrollView>
    );
}
