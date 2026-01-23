import { BlurView } from 'expo-blur';
import { Trash2 } from 'lucide-react-native';
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
    confirmText = 'Evet, Sil',
    cancelText = 'İptal',
    isLoading = false
}: DeleteConfirmModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View className="flex-1 justify-center items-center px-6">
                {/* Backdrop Blur */}
                <BlurView
                    intensity={20}
                    tint="dark"
                    className="absolute inset-0"
                />
                <Pressable className="absolute inset-0 bg-black/40" onPress={onCancel} />

                {/* Modal Content */}
                <View className="bg-slate-900 border border-slate-700/50 rounded-[32px] w-full p-8 shadow-2xl relative overflow-hidden">
                    {/* Background Glow */}
                    <View className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl" />

                    <View className="items-center">
                        <View className="w-16 h-16 bg-red-500/10 rounded-2xl items-center justify-center mb-6 border border-red-500/20">
                            <Trash2 size={32} color="#ef4444" />
                        </View>

                        <Text className="text-white text-2xl font-bold text-center mb-2">
                            {title}
                        </Text>

                        <Text className="text-slate-400 text-center text-sm leading-relaxed mb-8">
                            {message}
                        </Text>
                    </View>

                    <View className="flex-row space-x-3">
                        <TouchableOpacity
                            onPress={onCancel}
                            disabled={isLoading}
                            className="flex-1 bg-slate-800 py-4 rounded-2xl border border-slate-700 active:bg-slate-700"
                        >
                            <Text className="text-slate-300 font-bold text-center">
                                {cancelText}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 ${isLoading ? 'bg-red-900/50' : 'bg-red-600'} py-4 rounded-2xl shadow-lg shadow-red-500/20 active:bg-red-700`}
                        >
                            <Text className="text-white font-bold text-center">
                                {isLoading ? 'Siliniyor...' : confirmText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
