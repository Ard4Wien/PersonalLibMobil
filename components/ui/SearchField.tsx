import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface SearchFieldProps {
    placeholder: string;
    onSelect: (item: any) => void;
    searchFn: (query: string) => Promise<any[]>;
    getSubtitle: (item: any) => string;
    iconColor?: string;
}

export const SearchField = ({ placeholder, onSelect, searchFn, getSubtitle, iconColor = "#9333ea" }: SearchFieldProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

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
            const results = await searchFn(searchQuery);
            setSearchResults(results);
        } catch (err) {
            console.error('[SearchField] Error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelect = (item: any) => {
        onSelect(item);
        setSearchResults([]);
        setSearchQuery('');
    };

    return (
        <View className="mb-4">
            <Input
                placeholder={placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                rightElement={
                    isSearching ? (
                        <ActivityIndicator size="small" color={iconColor} />
                    ) : (
                        <Search size={20} color="#64748b" />
                    )
                }
            />

            {searchResults.length > 0 && (
                <View
                    className="bg-slate-900 border border-slate-800 rounded-2xl mt-2 overflow-hidden shadow-2xl"
                    style={{ maxHeight: 300 }}
                >
                    <ScrollView
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={true}
                    >
                        {searchResults.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleSelect(item)}
                                className="flex-row items-center p-3 border-b border-slate-800 active:bg-slate-800"
                            >
                                <Image
                                    source={
                                        (item.coverImage || item.imageUrl || item.image || item.cover_image || item.image_url)
                                            ? { uri: api.utils.optimizeImage(item.coverImage || item.imageUrl || item.image || item.cover_image || item.image_url) }
                                            : { uri: 'https://via.placeholder.com/150x225?text=Gorsel+Yok' }
                                    }
                                    className="w-10 h-14 rounded-md bg-slate-800"
                                />
                                <View className="ml-3 flex-1">
                                    <Text className="text-white font-bold text-sm" numberOfLines={1}>
                                        {item.title || item.name || item.baslik}
                                    </Text>
                                    <Text className="text-slate-400 text-xs" numberOfLines={1}>
                                        {getSubtitle(item)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};
