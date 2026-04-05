import { useLanguage } from '@/contexts/LanguageContext';
import { BlurView } from 'expo-blur';
import { Trash2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

interface DeleteConfirmModalProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export const DeleteConfirmModal = ({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText,
    cancelText,
    isLoading = false
}: DeleteConfirmModalProps) => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useLanguage();

    const finalConfirmText = confirmText || t('confirmDelete');
    const finalCancelText = cancelText || t('cancel');

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent={true}
            navigationBarTranslucent={true}
            onRequestClose={onCancel}
        >
            <View className="flex-1 justify-center items-center px-6">
                {/* Backdrop Blur */}
                <BlurView
                    intensity={25}
                    tint={isDark ? "dark" : "light"}
                    className="absolute inset-0"
                />
                <Pressable className={`absolute inset-0 ${isDark ? 'bg-black/60' : 'bg-slate-900/20'}`} onPress={onCancel} />

                {/* Modal Content */}
                <View className="bg-surface border border-border rounded-[32px] w-full p-8 shadow-2xl relative overflow-hidden">
                    {/* Background Glow */}
                    <View className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl" />

                    <View className="items-center">
                        <View className="w-16 h-16 bg-red-500/10 rounded-2xl items-center justify-center mb-6 border border-red-500/20">
                            <Trash2 size={32} color="#ef4444" />
                        </View>

                        <Text className="text-text-primary text-2xl font-bold text-center mb-2">
                            {title}
                        </Text>

                        <Text className="text-text-secondary text-center text-sm leading-relaxed mb-8">
                            {message}
                        </Text>
                    </View>

                    <View className="flex-row space-x-3">
                        <TouchableOpacity
                            onPress={onCancel}
                            disabled={isLoading}
                            className="flex-1 bg-surface-light py-4 rounded-2xl border border-border active:bg-border/30"
                        >
                            <Text className="text-text-secondary font-bold text-center">
                                {finalCancelText}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 ${isLoading ? 'bg-red-900/50' : 'bg-red-600'} py-4 rounded-2xl shadow-lg shadow-red-500/20 active:bg-red-700`}
                        >
                            <Text className="text-white font-bold text-center">
                                {isLoading ? t('deleting') : finalConfirmText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
