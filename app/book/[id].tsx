import { StatusPicker } from '@/components/ui/StatusPicker';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { scheduleReadingNudge } from '@/lib/notifications';
import { MediaStatus } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { BookOpen, ChevronLeft, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function BookDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
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

    const { data: books } = useQuery({ queryKey: ['books'], queryFn: () => api.books.list() });
    const book = books?.find(b => b.id === id);

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.books.updateStatus(id!, data),
        onSuccess: async (data: any, variables: any) => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            showToast(t('success'), 'success');

            if (variables.status === 'READING') {
                try {
                    const settingsStr = await SecureStore.getItemAsync('user_settings');
                    const settings = settingsStr ? JSON.parse(settingsStr) : null;
                    if (settings?.pushNotifications && book) {
                        await scheduleReadingNudge(book.title || book.baslik || t('book'), 'kitap');
                    }
                } catch (e) {
                    if (__DEV__) console.error('[BookDetail] Nudge scheduling error:', e);
                }
            }
        },
        onError: (e: any) => {
            if (__DEV__) console.error('[BookDetail] Update error:', e);
            showToast(e.message || t('error'), 'error');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.books.delete(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            showToast(t('deleteSuccess'), 'success');
            router.back();
        },
        onError: (e: any) => {
            if (__DEV__) console.error('[BookDetail] Delete error:', e);
            showToast(e.message || t('deleteError'), 'error');
        },
    });

    const handleDelete = () => {
        Alert.alert(t('deleteBook'), `"${book?.title || t('book')}" ${t('deleteQuestion')}`, [
            { text: t('cancel'), style: 'cancel' },
            { text: t('delete'), style: 'destructive', onPress: () => deleteMutation.mutate() },
        ]);
    };

    if (!book) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-text-secondary">{t('itemNotFound')}</Text>
            </View>
        );
    }

    const displayTitle = book.title || book.name || book.baslik || t('untitled');
    const displayAuthor = book.author || book.writer || book.yazar || t('noAuthor');
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
                        <Text className="text-text-muted text-sm uppercase tracking-wider mb-2">{t('about')}</Text>
                        <Text className="text-text-secondary">{book.description || book.summary || book.aciklama}</Text>
                    </View>
                )}

                <StatusPicker
                    label={t('status')}
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
                    <Text className="text-red-500 font-bold">{t('deleteBook')}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
