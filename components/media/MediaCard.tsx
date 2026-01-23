import { api } from '@/lib/api';
import { BlurView } from 'expo-blur';
import { Edit3, MoreVertical, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, Pressable, Text, TouchableOpacity, View } from 'react-native';

interface MediaCardProps {
    title?: string;
    subtitle?: string;
    image?: string;
    status?: string;
    genre?: string;
    onEdit?: () => void;
    onDelete?: () => void;
    // Allow for extra fields from backend
    [key: string]: any;
}

const statusColors: Record<string, string> = {
    WISHLIST: 'bg-pink-500/20 text-pink-500 border-pink-500/30',
    READING: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    WATCHING: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    COMPLETED: 'bg-green-500/20 text-green-500 border-green-500/30',
    DROPPED: 'bg-red-500/20 text-red-500 border-red-500/30',
};

const statusLabels: Record<string, string> = {
    WISHLIST: 'İstek Listesi',
    READING: 'Okunuyor',
    WATCHING: 'İzleniyor',
    COMPLETED: 'Tamamlandı',
    DROPPED: 'Bırakıldı',
};

const findValue = (obj: any, keys: string[]) => {
    if (!obj) return undefined;

    // 1. Check direct keys on the object
    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
    }

    // 2. Check common wrapper keys (important for nested backend responses)
    const wrappers = ['attributes', 'data', 'book', 'item', 'media', 'movie', 'series', 'content'];
    for (const wrapper of wrappers) {
        if (obj[wrapper] && typeof obj[wrapper] === 'object') {
            for (const key of keys) {
                if (obj[wrapper][key] !== undefined && obj[wrapper][key] !== null && obj[wrapper][key] !== '') {
                    return obj[wrapper][key];
                }
            }
        }
    }

    return undefined;
};

export const MediaCard = ({ title, subtitle, image, status, genre, onEdit, onDelete, ...rest }: MediaCardProps) => {
    const [showMenu, setShowMenu] = useState(false);

    // Combine props and the rest of the object for searching
    const data = { title, subtitle, image, status, genre, ...rest };

    const displayTitle = findValue(data, [
        'title', 'name', 'baslik', 'ad', 'isim', 'label',
        'bookTitle', 'movieTitle', 'seriesTitle',
        'Title', 'Name', 'Baslik', 'Ad'
    ]) || 'İsimsiz';

    const displaySubtitle = findValue(data, [
        'subtitle', 'author', 'director', 'creator', 'writer', 'yazar',
        'yonetmen', 'yapimci', 'Artist', 'Author', 'Director', 'Writer'
    ]) || '';

    const displayImage = api.utils.optimizeImage(findValue(data, [
        'image', 'coverImage', 'imageUrl', 'cover_image', 'cover', 'thumbnail', 'poster',
        'Image', 'ImageUrl', 'CoverImage', 'Resim', 'Gorsel'
    ]));

    const displayGenre = findValue(data, [
        'genre', 'category', 'type', 'tur', 'kategori', 'Genre', 'Category'
    ]) || '';

    const displayStatusRaw = findValue(data, ['status', 'Status', 'durum', 'Durum', 'overallStatus']);
    const displayStatus = typeof displayStatusRaw === 'string' ? displayStatusRaw.toUpperCase() : displayStatusRaw;

    return (
        <View className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden mb-4 w-[48%] relative">
            <View className="aspect-[2/3] bg-slate-800">
                {displayImage ? (
                    <Image source={{ uri: displayImage }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <View className="flex-1 items-center justify-center opacity-30">
                        <Text className="text-white text-[10px]">Görsel Yok</Text>
                    </View>
                )}

                {displayStatus && (
                    <View className="absolute top-2 left-2 overflow-hidden rounded-md border border-white/10">
                        <BlurView intensity={60} tint="dark" className="px-2 py-1">
                            <Text className={`text-[10px] font-bold ${statusColors[displayStatus] ? statusColors[displayStatus].split(' ')[1] : 'text-slate-400'}`}>
                                {statusLabels[displayStatus] || displayStatus}
                            </Text>
                        </BlurView>
                    </View>
                )}
            </View>

            {/* Action Menu - Full Card Overlay */}
            {showMenu && (
                <Pressable
                    onPress={() => setShowMenu(false)}
                    className="absolute inset-0 z-30 bg-black/70 items-center justify-center p-4 backdrop-blur-sm"
                >
                    <View className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full py-2 shadow-2xl overflow-hidden">
                        {onEdit && (
                            <TouchableOpacity
                                onPress={() => {
                                    setShowMenu(false);
                                    onEdit();
                                }}
                                className="flex-row items-center px-4 py-3 active:bg-slate-800 border-b border-slate-800/50"
                            >
                                <View className="w-8 h-8 rounded-lg bg-blue-500/10 items-center justify-center mr-3">
                                    <Edit3 size={14} color="#60a5fa" />
                                </View>
                                <Text className="text-slate-200 text-xs font-bold">Düzenle</Text>
                            </TouchableOpacity>
                        )}
                        {onDelete && (
                            <TouchableOpacity
                                onPress={() => {
                                    setShowMenu(false);
                                    onDelete();
                                }}
                                className="flex-row items-center px-4 py-3 active:bg-slate-800"
                            >
                                <View className="w-8 h-8 rounded-lg bg-red-500/10 items-center justify-center mr-3">
                                    <Trash2 size={14} color="#f87171" />
                                </View>
                                <Text className="text-red-400 text-xs font-bold">Kaldır</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Pressable>
            )}

            <View className="p-3 bg-slate-900/90 h-[105px] flex-col justify-between">
                <View>
                    <View className="flex-row justify-between items-start mb-1 h-[38px]">
                        <Text className="text-white font-bold text-sm leading-tight flex-1" numberOfLines={2}>
                            {displayTitle}
                        </Text>

                        {(onEdit || onDelete) && (
                            <TouchableOpacity
                                onPress={() => setShowMenu(true)}
                                className="w-7 h-7 bg-purple-600/20 rounded-lg items-center justify-center border border-purple-500/30 ml-2"
                            >
                                <MoreVertical size={14} color="#a855f7" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {displaySubtitle ? (
                        <Text className="text-slate-400 text-[10px] h-[14px]" numberOfLines={1}>
                            {displaySubtitle}
                        </Text>
                    ) : (
                        <View className="h-[14px]" />
                    )}
                </View>

                <View className="mt-auto pt-2 border-t border-slate-800/50 flex-row justify-between items-center">
                    {displayGenre ? (
                        <View className="bg-purple-600/10 px-2 py-0.5 rounded border border-purple-500/20 max-w-[70%]">
                            <Text className="text-purple-400 text-[9px] font-bold uppercase tracking-tighter" numberOfLines={1}>
                                {displayGenre}
                            </Text>
                        </View>
                    ) : <View />}
                </View>
            </View>
        </View>
    );
};
