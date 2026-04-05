import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { ChevronLeft, Github, Globe, Info, Mail } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function AboutScreen() {
    const router = useRouter();
    const { t } = useLanguage();

    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const openLink = (url: string) => {
        Linking.openURL(url).catch(() => { });
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-14 pb-6 border-b border-border">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 bg-surface border border-border rounded-full items-center justify-center shadow-sm"
                >
                    <ChevronLeft size={24} color={isDark ? "#fff" : "#0f172a"} />
                </TouchableOpacity>
                <Text className="text-text-primary text-xl font-bold">{t('about')}</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-10">
                <View className="items-center mb-10">
                    <View className="w-20 h-20 bg-purple-600 rounded-3xl items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                        <Info size={40} color="white" />
                    </View>
                    <Text className="text-text-primary text-2xl font-bold">PersonalLib</Text>
                    <Text className="text-text-muted mt-1">{t('version')} 1.1.0</Text>
                </View>

                <View className="bg-surface border border-border rounded-3xl p-6 mb-8 shadow-sm">
                    <Text className="text-text-secondary leading-6 text-base">
                        {t('aboutDesc')}
                    </Text>
                </View>

                <View className="mb-10">
                    <Text className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-4 ml-2">{t('contact')}</Text>
                    <View className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
                        <TouchableOpacity
                            onPress={() => openLink('https://personal-lib.vercel.app')}
                            className="flex-row items-center p-4 border-b border-border active:bg-surface-light"
                        >
                            <View className="w-9 h-9 bg-surface-light border border-border/50 rounded-lg items-center justify-center mr-4">
                                <Globe size={18} color={isDark ? "#94a3b8" : "#475569"} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-text-primary font-medium">{t('website')}</Text>
                                <Text className="text-text-muted text-[10px]">personal-lib.vercel.app</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => openLink('https://github.com/Ard4Wien')}
                            className="flex-row items-center p-4 border-b border-border active:bg-surface-light"
                        >
                            <View className="w-9 h-9 bg-surface-light border border-border/50 rounded-lg items-center justify-center mr-4">
                                <Github size={18} color={isDark ? "#94a3b8" : "#475569"} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-text-primary font-medium">GitHub</Text>
                                <Text className="text-text-muted text-[10px]">github.com/Ard4Wien</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => openLink('mailto:personallibinfo@gmail.com')}
                            className="flex-row items-center p-4 active:bg-surface-light"
                        >
                            <View className="w-9 h-9 bg-surface-light border border-border/50 rounded-lg items-center justify-center mr-4">
                                <Mail size={18} color={isDark ? "#94a3b8" : "#475569"} />
                            </View>
                            <Text className="text-text-primary font-medium flex-1">{t('sendEmail')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text className="text-slate-600 text-center text-xs pb-12 font-medium tracking-wide">
                    Developed by <Text className="text-purple-500 font-bold">Arda</Text> • © 2026
                </Text>
            </ScrollView>
        </View>
    );
}
