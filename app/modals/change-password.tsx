import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Lock, ShieldCheck } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { show: showToast } = useToast();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useLanguage();

    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNewGroup, setShowNewGroup] = useState(false);

    const handleUpdatePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast(t('fillRequired'), 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast(t('passwordTooShort'), 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast(t('passwordsDoNotMatch'), 'error');
            return;
        }

        setLoading(true);
        try {
            await api.auth.changePassword({
                currentPassword,
                newPassword,
                confirmPassword
            });
            showToast(t('passwordUpdated'), 'success');
            router.back();
        } catch (e: any) {
            showToast(e.message || t('passwordUpdateError'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <ScrollView className="flex-1 px-6 pt-8">
                <View className="items-center mb-10">
                    <View className="w-16 h-16 bg-purple-500/10 rounded-3xl items-center justify-center mb-4">
                        <Lock size={32} color="#a855f7" />
                    </View>
                    <Text className="text-text-primary text-lg font-bold text-center">{t('securityTitle')}</Text>
                    <Text className="text-text-muted text-sm text-center mt-1 px-4">
                        {t('securityDesc')}
                    </Text>
                </View>

                <Input
                    label={t('currentPassword')}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    isPasswordVisible={showCurrent}
                    onTogglePassword={() => setShowCurrent(!showCurrent)}
                    placeholder={t('placeholderOldPassword')}
                />

                <View className="h-[1px] bg-border/20 my-4" />

                <Input
                    label={t('newPassword')}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    isPasswordVisible={showNewGroup}
                    onTogglePassword={() => setShowNewGroup(!showNewGroup)}
                    placeholder={t('placeholderAtLeast6')}
                />

                <Input
                    label={t('confirmNewPassword')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    isPasswordVisible={showNewGroup}
                    onTogglePassword={() => setShowNewGroup(!showNewGroup)}
                    placeholder={t('placeholderConfirmNew')}
                />

                <TouchableOpacity
                    onPress={handleUpdatePassword}
                    disabled={loading}
                    className={`bg-purple-600 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-purple-500/30 mt-4 active:scale-95 transition-all ${loading ? 'opacity-70' : ''}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <>
                            <ShieldCheck size={20} color="white" />
                            <Text className="text-white font-bold text-lg ml-2">{t('updateMyInfo')}</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View className="pb-20" />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

