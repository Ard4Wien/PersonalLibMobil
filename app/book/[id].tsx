import { StatusPicker } from '@/components/ui/StatusPicker';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { MediaStatus } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, ChevronLeft, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const STATUS_OPTIONS: { label: string; value: MediaStatus }[] = [
    { label: 'İstek Listesi', value: 'WISHLIST' },
    { label: 'Okunuyor', value: 'READING' },
    { label: 'Tamamlandı', value: 'COMPLETED' },
    { label: 'Bırakıldı', value: 'DROPPED' },
];

export default function BookDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { show: showToast } = useToast();

    const { data: books } = useQuery({ queryKey: ['books'], queryFn: () => api.books.list() });
    const book = books?.find(b => b.id === id);

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.books.update(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            showToast('Durum güncellendi', 'success');
        },
        onError: (e: any) => {
            console.error('[BookDetail] Update error:', e);
            showToast(e.message || 'Durum güncellenemedi', 'error');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.books.delete(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            showToast('Kitap silindi', 'success');
            router.back();
        },
        onError: (e: any) => {
            console.error('[BookDetail] Delete error:', e);
            showToast(e.message || 'Kitap silinemedi', 'error');
        },
    });

    const handleDelete = () => {
        Alert.alert('Silme Onayı', 'Bu kitabı silmek istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            { text: 'Sil', style: 'destructive', onPress: () => deleteMutation.mutate() },
        ]);
    };

    if (!book) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-text-secondary">Kitap bulunamadı</Text>
            </View>
        );
    }

    const displayTitle = book.title || book.name || book.baslik || 'İsimsiz';
    const displayAuthor = book.author || book.writer || book.yazar || '';
    const displayImage = book.coverImage || book.image || book.imageUrl || book.cover_image;

    return (
        <ScrollView className="flex-1 bg-background">
            <View className="relative">
                {displayImage ? (
                    <Image source={{ uri: displayImage }} className="w-full h-80" resizeMode="cover" />
                ) : (
                    <View className="w-full h-80 bg-slate-900 items-center justify-center">
                        <BookOpen size={64} color="#64748b" />
                    </View>
                )}
                <View className="absolute inset-0 bg-black/40" />
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-4 bg-black/50 p-2 rounded-full"
                >
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View className="px-6 -mt-16 relative z-10">
                <Text className="text-white text-3xl font-bold mb-2">{displayTitle}</Text>
                <Text className="text-text-secondary text-lg mb-4">{displayAuthor}</Text>

                {(book.description || book.summary || book.aciklama) && (
                    <View className="mb-6">
                        <Text className="text-text-muted text-sm uppercase tracking-wider mb-2">Açıklama</Text>
                        <Text className="text-text-secondary">{book.description || book.summary || book.aciklama}</Text>
                    </View>
                )}

                <StatusPicker
                    label="Durum"
                    options={STATUS_OPTIONS}
                    value={book.status}
                    onChange={(status) => updateMutation.mutate({ status })}
                    color="purple"
                />

                <TouchableOpacity
                    onPress={handleDelete}
                    disabled={deleteMutation.isPending}
                    className={`flex-row items-center justify-center space-x-2 bg-red-600/10 border border-red-500/30 py-4 rounded-xl mb-12 ${deleteMutation.isPending ? 'opacity-50' : ''}`}
                >
                    <Trash2 size={20} color="#ef4444" />
                    <Text className="text-red-500 font-bold">Kitabı Sil</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
