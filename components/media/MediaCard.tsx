import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { BlurView } from 'expo-blur';
import { Edit3, MoreVertical, Star, Trash2 } from 'lucide-react-native';
import React, { memo, useState } from 'react';
import { Image, Pressable, Text, TouchableOpacity, View } from 'react-native';

interface MediaCardProps {
    title?: string;
    subtitle?: string;
    image?: string;
    status?: string;
    genre?: string;
    onEdit?: () => void;
    onDelete?: () => void;
    onToggleFavorite?: () => void;
    isFavorite?: boolean;
    isHome?: boolean;
    [key: string]: any;
}

const statusColors: Record<string, string> = {
    WISHLIST: 'bg-pink-500/20 text-pink-500 border-pink-500/30',
    READING: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    WATCHING: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    COMPLETED: 'bg-green-500/20 text-green-500 border-green-500/30',
    DROPPED: 'bg-red-500/20 text-red-500 border-red-500/30',
};

const findValue = (obj: any, keys: string[]) => {
    if (!obj) return undefined;

    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
    }

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

const MediaCardComponent = ({ title, subtitle, image, status, genre, onEdit, onDelete, onToggleFavorite, isFavorite: propIsFavorite, isHome, ...rest }: MediaCardProps) => {
    const [showMenu, setShowMenu] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { t } = useLanguage();

    const data = { title, subtitle, image, status, genre, isFavorite: propIsFavorite, ...rest };

    const displayTitle = title || findValue(data, ['name', 'baslik', 'ad', 'isim']) || t('untitled');
    const displaySubtitle = subtitle || findValue(data, ['author', 'director', 'creator', 'writer', 'yazar', 'yonetmen', 'yapimci']) || '';
    const rawImage = image || findValue(data, ['coverImage', 'imageUrl', 'cover_image', 'cover', 'thumbnail', 'poster']);
    const displayImage = api.utils.optimizeImage(rawImage);

    const displayGenre = findValue(data, ['genre', 'category', 'tur', 'kategori', 'Genre', 'Category']) || ((data as any).type !== data.title ? (data as any).type : '') || '';

    const displayStatusRaw = findValue(data, ['status', 'Status', 'durum', 'Durum', 'overallStatus']);
    const displayStatus = typeof displayStatusRaw === 'string' ? displayStatusRaw.toUpperCase() : displayStatusRaw;

    const isFavorite = propIsFavorite ?? (findValue(data, ['isFavorite', 'is_favorite', 'Favorite']) === true);

    return (
        <View className="bg-surface border border-border rounded-2xl overflow-hidden mb-4 w-[48%] relative shadow-sm">
            <View className="aspect-[2/3] bg-slate-800">
                {displayImage ? (
                    <Image
                        source={{ uri: imageError ? rawImage : displayImage }}
                        className="w-full h-full"
                        resizeMode="cover"
                        onError={() => {
                            if (!imageError) {
                                setImageError(true);
                            }
                        }}
                    />
                ) : (
                    <View className="flex-1 items-center justify-center opacity-30">
                        <Text className="text-white text-[10px]">{t('noImage')}</Text>
                    </View>
                )}

                {displayStatus && (
                    <View className="absolute top-2 left-2 overflow-hidden rounded-md border border-white/10">
                        <BlurView intensity={60} tint="dark" className="px-2 py-1">
                            <Text className={`text-[10px] font-bold ${statusColors[displayStatus] ? statusColors[displayStatus].split(' ')[1] : 'text-slate-400'}`}>
                                {displayStatus === 'WISHLIST' ? t('statusWishlist') :
                                    displayStatus === 'READING' ? t('statusReading') :
                                        displayStatus === 'WATCHING' ? t('statusWatching') :
                                            displayStatus === 'COMPLETED' ? t('statusCompleted') :
                                                displayStatus === 'DROPPED' ? t('statusDropped') : displayStatus}
                            </Text>
                        </BlurView>
                    </View>
                )}

                {isFavorite && (
                    <View className="absolute top-2 right-2 overflow-hidden rounded-full border border-yellow-500/20 shadow-lg shadow-yellow-500/20">
                        <BlurView intensity={80} tint="dark" className="p-1.5">
                            <Star size={12} color="#fbbf24" fill="#fbbf24" />
                        </BlurView>
                    </View>
                )}

                {displayStatus === 'WATCHING' && (findValue(data, ['lastSeason']) || findValue(data, ['lastEpisode'])) && (
                    <View className="absolute bottom-2 right-2 overflow-hidden rounded-md border border-cyan-500/30">
                        <BlurView intensity={80} tint="dark" className="px-2 py-1 flex-row items-center">
                            <Text className="text-cyan-400 text-[10px] font-black italic">
                                {t('seasonAbbr')}{findValue(data, ['lastSeason']) || 1} {t('episodeAbbr')}{findValue(data, ['lastEpisode']) || 0}
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
                        {onToggleFavorite && (
                            <TouchableOpacity
                                onPress={() => {
                                    setShowMenu(false);
                                    onToggleFavorite();
                                }}
                                className="flex-row items-center px-3 py-2.5 active:bg-slate-800 border-b border-slate-800/50"
                                accessibilityLabel={isFavorite ? t('actionRemoveFavorite') : t('actionAddFavorite')}
                                accessibilityRole="button"
                            >
                                <View className="w-7 h-7 rounded-lg bg-yellow-500/10 items-center justify-center mr-2 flex-shrink-0">
                                    <Star size={12} color="#fbbf24" fill={isFavorite ? "#fbbf24" : "transparent"} />
                                </View>
                                <Text className="text-slate-200 text-[10px] font-bold flex-1 leading-tight" numberOfLines={2}>
                                    {isFavorite ? t('actionRemoveFavorite') : t('actionAddFavorite')}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {onEdit && (
                            <TouchableOpacity
                                onPress={() => {
                                    setShowMenu(false);
                                    onEdit();
                                }}
                                className="flex-row items-center px-3 py-2.5 active:bg-slate-800 border-b border-slate-800/50"
                                accessibilityLabel={t('actionEdit')}
                                accessibilityRole="button"
                            >
                                <View className="w-7 h-7 rounded-lg bg-blue-500/10 items-center justify-center mr-2 flex-shrink-0">
                                    <Edit3 size={12} color="#60a5fa" />
                                </View>
                                <Text className="text-slate-200 text-[10px] font-bold flex-1 leading-tight" numberOfLines={2}>{t('actionEdit')}</Text>
                            </TouchableOpacity>
                        )}
                        {onDelete && (
                            <TouchableOpacity
                                onPress={() => {
                                    setShowMenu(false);
                                    onDelete();
                                }}
                                className="flex-row items-center px-3 py-2.5 active:bg-slate-800"
                                accessibilityLabel={t('actionRemove')}
                                accessibilityRole="button"
                            >
                                <View className="w-7 h-7 rounded-lg bg-red-500/10 items-center justify-center mr-2 flex-shrink-0">
                                    <Trash2 size={12} color="#f87171" />
                                </View>
                                <Text className="text-red-400 text-[10px] font-bold flex-1 leading-tight" numberOfLines={2}>{t('actionRemove')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Pressable>
            )}

            <View className={`p-3 bg-surface h-[105px] flex-col justify-between ${isHome ? 'pb-1' : ''}`}>
                <View>
                    <View className="flex-row justify-between items-start mb-1 h-[38px]">
                        <Text className="text-text-primary font-bold text-sm leading-tight flex-1" numberOfLines={2}>
                            {displayTitle}
                        </Text>

                        {(onEdit || onDelete) && (
                            <TouchableOpacity
                                onPress={() => setShowMenu(true)}
                                className="w-7 h-7 bg-purple-600/20 rounded-lg items-center justify-center border border-purple-500/30 ml-2"
                                accessibilityLabel={t('menu')}
                                accessibilityRole="button"
                            >
                                <MoreVertical size={14} color="#a855f7" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {displaySubtitle ? (
                        <Text className="text-text-secondary text-[10px] h-[18px]" numberOfLines={1}>
                            {displaySubtitle}
                        </Text>
                    ) : (
                        <View className="h-[18px]" />
                    )}
                </View>

                <View className="mt-auto pt-2 border-t border-border/50 flex-row justify-between items-center">
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

MediaCardComponent.displayName = 'MediaCard';
export const MediaCard = memo(MediaCardComponent);
