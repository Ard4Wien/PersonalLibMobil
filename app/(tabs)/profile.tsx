import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { LogOut, User as UserIcon } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const { user, logout } = useAuth();

    const { data: books } = useQuery({ queryKey: ['books'], queryFn: () => api.books.list() });
    const { data: movies } = useQuery({ queryKey: ['movies'], queryFn: () => api.movies.list() });
    const { data: series } = useQuery({ queryKey: ['series'], queryFn: () => api.series.list() });

    return (
        <View className="flex-1 bg-background pt-16">
            <ScrollView className="flex-1 px-6">
                <View className="items-center mb-8">
                    <View className="relative">
                        <View className="w-24 h-24 rounded-full border-4 border-purple-600/50 bg-slate-900 items-center justify-center overflow-hidden shadow-2xl shadow-purple-500/30">
                            {user?.avatarUrl ? (
                                <Image source={{ uri: user.avatarUrl }} className="w-full h-full" />
                            ) : (
                                <UserIcon size={48} color="#94a3b8" />
                            )}
                        </View>
                    </View>
                    <Text className="text-white text-2xl font-bold mt-4 text-center">{user?.displayName || 'Kullanıcı'}</Text>
                    <Text className="text-text-muted text-sm text-center">{user?.email}</Text>
                </View>

                {/* Stats Grid - Modern & Spacious */}
                <View className="flex-row gap-4 mb-8">
                    <View className="items-center bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl flex-1 backdrop-blur-md shadow-sm">
                        <Text className="text-purple-400 font-bold text-3xl">{books?.length || 0}</Text>
                        <Text className="text-purple-300/60 text-[10px] uppercase font-bold text-center mt-1 tracking-wider">Kitap</Text>
                    </View>
                    <View className="items-center bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex-1 backdrop-blur-md shadow-sm">
                        <Text className="text-blue-400 font-bold text-3xl">{movies?.length || 0}</Text>
                        <Text className="text-blue-300/60 text-[10px] uppercase font-bold text-center mt-1 tracking-wider">Film</Text>
                    </View>
                    <View className="items-center bg-pink-500/10 border border-pink-500/20 p-4 rounded-2xl flex-1 backdrop-blur-md shadow-sm">
                        <Text className="text-pink-400 font-bold text-3xl">{series?.length || 0}</Text>
                        <Text className="text-pink-300/60 text-[10px] uppercase font-bold text-center mt-1 tracking-wider">Dizi</Text>
                    </View>
                </View>

                <View className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 mb-8">
                    <Text className="text-text-secondary text-xs font-bold mb-4 uppercase tracking-widest opacity-50">Hesap Bilgileri</Text>

                    <View className="flex-row justify-between py-3 border-b border-slate-800/80">
                        <Text className="text-text-muted">E-posta</Text>
                        <Text className="text-white font-medium">{user?.email || 'kullanici@email.com'}</Text>
                    </View>
                    <View className="flex-row justify-between py-3 border-b border-slate-800/80">
                        <Text className="text-text-muted">Kullanıcı Adı</Text>
                        <Text className="text-white font-medium">@{user?.username || 'user'}</Text>
                    </View>
                    <View className="flex-row justify-between py-3">
                        <Text className="text-text-muted">Görünen Ad</Text>
                        <Text className="text-white font-medium">{user?.displayName || 'Kullanıcı'}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={logout}
                    className="flex-row items-center justify-center space-x-2 bg-red-600/10 border border-red-500/20 py-4 rounded-xl mb-12"
                >
                    <LogOut size={18} color="#ef4444" />
                    <Text className="text-red-500 font-bold ml-2">Oturumu Kapat</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
