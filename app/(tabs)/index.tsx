import { MediaCard } from '@/components/media/MediaCard';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus , BookOpen, Check, Heart, Library, XOctagon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';


import { PageHeader } from '@/components/ui/PageHeader';


export default function BooksScreen() {
  const [filter, setFilter] = useState('ALL');
  const router = useRouter();
  const { t } = useLanguage();
  const { show: showToast } = useToast();
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState({ visible: false, id: '', title: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data: books, isLoading, refetch } = useQuery({
    queryKey: ['books'],
    queryFn: () => api.books.list(),
  });

  const STATUS_FILTERS = [
    { label: t('filterAll'), value: 'ALL', icon: Library },
    { label: t('filterReading'), value: 'READING', icon: BookOpen },
    { label: t('filterRead'), value: 'COMPLETED', icon: Check },
    { label: t('filterDropped'), value: 'DROPPED', icon: XOctagon },
    { label: t('filterWishlist'), value: 'WISHLIST', icon: Heart },
  ];

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      await api.books.updateStatus(id, { isFavorite: !isFavorite });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    } catch (err) {
      showToast(t('error'), 'error');
    }
  };

  const handleDelete = (id: string, title: string) => {
    setDeleteModal({ visible: true, id, title });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.books.delete(deleteModal.id);
      queryClient.invalidateQueries({ queryKey: ['books'] });
      showToast(t('deleteSuccess'), 'success');
      setDeleteModal({ visible: false, id: '', title: '' });
    } catch (err) {
      showToast(t('deleteError'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View className="flex-1 bg-background pt-16">
      <PageHeader
        title={t('library')}
        subtitle={`${books?.length || 0} ${t('bookCount')}`}
        icon={Library}
        rightAction={
          <TouchableOpacity
            onPress={() => router.push('/modals/add-book')}
            className="w-10 h-10 bg-purple-600 rounded-xl items-center justify-center shadow-lg shadow-purple-500/20 active:bg-purple-700"
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-6 mb-6 max-h-12"
      >
        <View className="flex-row space-x-2 mr-6">
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg flex-row items-center space-x-2 border ${filter === f.value
                ? 'bg-purple-600 border-purple-500'
                : 'bg-surface border-border'
                }`}
            >
              <f.icon size={16} color={filter === f.value ? 'white' : (isDark ? '#94a3b8' : '#64748b')} className="mr-2" />
              <Text className={`${filter === f.value ? 'text-white' : 'text-text-secondary'} font-medium ml-2`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        className="flex-1 px-6"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#9333ea" />}
      >
        {books?.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View className="bg-surface p-6 rounded-full mb-4 shadow-sm border border-border">
              <Library size={48} color={isDark ? "#64748b" : "#94a3b8"} />
            </View>
            <Text className="text-text-secondary text-lg">{t('noBooks')}</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between pb-10">
            {books?.filter(b => filter === 'ALL' || b.status === filter).map((book) => (
              <MediaCard
                key={book.id}
                {...book}
                isHome={true}
                onEdit={() => router.push({ pathname: '/modals/edit-book', params: { id: book.id } })}
                onDelete={() => handleDelete(book.id, book.title || (book as any).name || t('book'))}
                onToggleFavorite={() => toggleFavorite(book.id, book.isFavorite || false)}
              />
            ))}
          </View>
        )}
      </ScrollView>
      <DeleteConfirmModal
        visible={deleteModal.visible}
        title={t('deleteBook')}
        message={`"${deleteModal.title}" ${t('deleteQuestion')} ${t('deleteWarning')}`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ ...deleteModal, visible: false })}
        isLoading={isDeleting}
      />
    </View >
  );
}
