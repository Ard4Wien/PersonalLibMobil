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
    { label: 'Okunuyor', value: 'READING' },
    { label: 'Okundu', value: 'COMPLETED' },
    { label: 'Bırakıldı', value: 'DROPPED' },
];

export default function EditBookModal() {
    const params = useLocalSearchParams();
    const id = params.id as string;
    const router = useRouter();
    const queryClient = useQueryClient();
    const { show: showToast } = useToast();

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
            console.log('=== EDIT BOOK DEBUG ===');
            console.log('Received ID:', id);
            console.log('Books count:', books?.length);
            console.log('Book IDs:', books?.map(b => b.id));

            // Flexible ID matching - compare as strings and check alternative fields
            const foundBook = books.find(b => {
                const itemId = String(b.id || (b as any)._id || '');
                const paramId = String(id || '');
                return itemId === paramId;
            });

            console.log('Found book:', foundBook);

            if (foundBook) {
                // Handle nested book data structure
                const bookData = (foundBook as any).book || foundBook;
                const userStatus = (foundBook as any).overallStatus || foundBook.status || 'READING';
                const refId = (foundBook as any).bookId || bookData.id;

                console.log('[EditBook] Using book data:', JSON.stringify(bookData).substring(0, 100));

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
            console.log('[EditBook] Update API broken, falling back to DELETE + CREATE strategy...');

            // 1. Delete existing record
            try {
                await api.books.delete(id);
                console.log('[EditBook] Old record deleted successfully.');
            } catch (err) {
                console.error('[EditBook] Delete failed:', err);
                throw new Error('Eski kayıt silinemedi, işlem iptal edildi.');
            }

            // 2. Create new record with updated data
            const createData: any = {
                title: formData.title,    // API expects 'title'
                name: formData.title,     // Fallback

                author: formData.author,  // API likely expects 'author'
                writer: formData.author,  // Fallback

                coverImage: formData.coverImage,
                imageUrl: formData.coverImage,
                image: formData.coverImage,

                genre: formData.genre,
                category: formData.genre,

                status: formData.status,
            };

            return await api.books.create(createData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            showToast('Kitap başarıyla güncellendi', 'success');
            router.back();
        },
        onError: (e: any) => showToast(e.message || 'Kitap güncellenemedi', 'error'),
    });

    // ... internal implementation ...

    const handleSubmit = () => {
        const newErrors = validateMedia(formData, 'book');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast('Lütfen zorunlu alanları doldurun', 'error');
            return;
        }

        setErrors({});
        // Everything else is handled by the mutationFn and api.request
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
                    title="Değişiklikleri Kaydet"
                    onPress={handleSubmit}
                    loading={mutation.isPending}
                    className="mt-4"
                />
            </View>
        </ScrollView>
    );
}
