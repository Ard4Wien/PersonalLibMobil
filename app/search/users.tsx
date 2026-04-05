import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, User as UserIcon, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UserSearchScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                handleSearch();
            } else {
                setUsers([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const results = await api.user.search(searchQuery);
            setUsers(results);
        } catch (error) {
            console.error('[UserSearch] Search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderUserItem = ({ item }: { item: User }) => (
        <TouchableOpacity
            onPress={() => router.push(`/portfolio/${item.username}` as any)}
            className="flex-row items-center justify-between p-4 mb-3 bg-surface border border-border rounded-2xl active:bg-border/20"
        >
            <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-full bg-slate-800/50 items-center justify-center overflow-hidden border border-border/50">
                    {item.avatarUrl ? (
                        <Image source={{ uri: item.avatarUrl }} className="w-full h-full" />
                    ) : (
                        <UserIcon size={24} color={isDark ? "#94a3b8" : "#cbd5e1"} />
                    )}
                </View>
                <View className="ml-4 flex-1">
                    <Text className="text-text-primary font-bold text-base" numberOfLines={1}>
                        {item.displayName || item.username}
                    </Text>
                    <Text className="text-text-muted text-xs">@{item.username}</Text>
                </View>
            </View>
            <ChevronRight size={18} color={isDark ? "#475569" : "#cbd5e1"} />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            <View className="px-6 pt-0 pb-2 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 w-10 h-10 items-center justify-center -mt-4">
                    <ChevronLeft size={28} color={isDark ? "#cbd5e1" : "#475569"} />
                </TouchableOpacity>
                <View className="flex-1">
                    <Input
                        placeholder={t('searchUsers')}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                        containerStyle="mb-0"
                        className="h-12"
                        rightElement={
                            searchQuery.length > 0 ? (
                                <TouchableOpacity
                                    onPress={() => setSearchQuery('')}
                                    className="pr-2"
                                >
                                    <X size={18} color={isDark ? "#94a3b8" : "#64748b"} />
                                </TouchableOpacity>
                            ) : null
                        }
                    />
                </View>
            </View>

            <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
                ListEmptyComponent={
                    !isLoading && searchQuery.length >= 2 ? (
                        <View className="items-center mt-20">
                            <Text className="text-text-muted">{t('userNotFound')}</Text>
                        </View>
                    ) : null
                }
                ListFooterComponent={
                    isLoading ? (
                        <ActivityIndicator className="mt-8" color="#9333ea" />
                    ) : null
                }
            />
        </View>
    );
}
