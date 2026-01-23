import { MediaCard } from '@/components/media/MediaCard';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { BookOpen, Check, Heart, Library } from 'lucide-react-native';

const STATUS_FILTERS = [
  { label: 'Tümü', value: 'ALL', icon: Library },
  { label: 'Okunuyor', value: 'READING', icon: BookOpen },
  { label: 'Okundu', value: 'COMPLETED', icon: Check },
  { label: 'İstek Listesi', value: 'WISHLIST', icon: Heart },
];

import { PageHeader } from '@/components/ui/PageHeader';

// ... (imports)

export default function BooksScreen() {
  const [filter, setFilter] = useState('ALL');
  const router = useRouter();
  const { show: showToast } = useToast();
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState({ visible: false, id: '', title: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: books, isLoading, refetch } = useQuery({
    queryKey: ['books'],
    queryFn: () => api.books.list(),
  });

  const handleDelete = (id: string, title: string) => {
    setDeleteModal({ visible: true, id, title });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.books.delete(deleteModal.id);
      queryClient.invalidateQueries({ queryKey: ['books'] });
      showToast('Kitap silindi', 'success');
      setDeleteModal({ visible: false, id: '', title: '' });
    } catch (err) {
      showToast('Silinemedi', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View className="flex-1 bg-background pt-16">
      <PageHeader
        title="Kitaplığım"
        subtitle={`${books?.length || 0} kitap`}
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
                : 'bg-surface border-slate-800'
                }`}
            >
              <f.icon size={16} color={filter === f.value ? 'white' : '#94a3b8'} className="mr-2" />
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
            <View className="bg-slate-900/50 p-6 rounded-full mb-4">
              <Library size={48} color="#64748b" />
            </View>
            <Text className="text-text-secondary text-lg">Henüz kitap eklenmemiş</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between pb-10">
            {books?.filter(b => filter === 'ALL' || b.status === filter).map((book) => (
              <MediaCard
                key={book.id}
                {...book}
                onEdit={() => router.push({ pathname: '/modals/edit-book', params: { id: book.id } })}
                onDelete={() => handleDelete(book.id, book.title || (book as any).name || 'Kitap')}
              />
            ))}
          </View>
        )}
      </ScrollView>
      <DeleteConfirmModal
        visible={deleteModal.visible}
        title="Kitabı Sil"
        message={`"${deleteModal.title}" kitabını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ ...deleteModal, visible: false })}
        isLoading={isDeleting}
      />
    </View >
  );
}
