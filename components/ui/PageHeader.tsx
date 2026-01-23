import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    rightAction?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, rightAction }: PageHeaderProps) {
    return (
        <View className="px-6 mb-6">
            <View className="flex-row justify-between items-center bg-slate-900/60 p-5 rounded-3xl border border-slate-800 backdrop-blur-md">
                <View className="flex-row items-center flex-1 pr-4">
                    {Icon && (
                        <View className="w-12 h-12 rounded-2xl bg-purple-500/10 items-center justify-center mr-4 border border-purple-500/20">
                            <Icon size={24} color="#a855f7" />
                        </View>
                    )}
                    <View>
                        <Text className="text-white text-xl font-bold tracking-tight">{title}</Text>
                        {subtitle && (
                            <Text className="text-slate-400 text-xs font-medium mt-0.5">{subtitle}</Text>
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
