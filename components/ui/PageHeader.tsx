import { useRouter } from 'expo-router';
import { ChevronLeft, LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    rightAction?: React.ReactNode;
    showBackButton?: boolean;
    iconColor?: string;
}

export function PageHeader({ title, subtitle, icon: Icon, rightAction, showBackButton, iconColor = "#a855f7" }: PageHeaderProps) {
    const router = useRouter();

    return (
        <View className="px-6 mb-6">
            <View className="flex-row justify-between items-center bg-surface p-5 rounded-3xl border border-border shadow-sm">
                <View className="flex-row items-center flex-1 pr-4">
                    {showBackButton && (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-surface border border-border rounded-xl items-center justify-center mr-3"
                        >
                            <ChevronLeft size={20} color={iconColor} />
                        </TouchableOpacity>
                    )}
                    {Icon && (
                        <View
                            className="w-12 h-12 rounded-2xl items-center justify-center mr-4 border"
                            style={{ backgroundColor: `${iconColor}10`, borderColor: `${iconColor}30` }}
                        >
                            <Icon size={24} color={iconColor} />
                        </View>
                    )}
                    <View className="flex-1">
                        <Text className="text-text-primary text-xl font-bold tracking-tight" numberOfLines={1}>{title}</Text>
                        {subtitle && (
                            <Text className="text-text-secondary text-xs font-medium mt-0.5" numberOfLines={1}>{subtitle}</Text>
                        )}
                    </View>
                </View>

                {rightAction && (
                    <View className="flex-row items-center gap-2">
                        {rightAction}
                    </View>
                )}
            </View>
        </View>
    );
}
