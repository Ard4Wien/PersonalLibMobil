import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useRouter } from 'expo-router';
import { Book, Film } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        email: '',
        password: '',
        passwordConfirm: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    const { register } = useAuth();
    const router = useRouter();
    const { show: showToast } = useToast();
    const { t } = useLanguage();

    const getLocalizedError = (msg: string) => {
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('email already in use') || lowerMsg.includes('email already exists')) return t('errorEmailInUse');
        if (lowerMsg.includes('weak password')) return t('errorWeakPassword');
        if (lowerMsg.includes('invalid email')) return t('errorInvalidEmail');
        if (lowerMsg.includes('network request failed')) return t('errorNetwork');
        return msg;
    };

    const handleRegister = async () => {
        const { username, displayName, email, password, passwordConfirm } = formData;

        if (!username || !displayName || !email || !password) {
            showToast(t('fillRequired'), 'error');
            return;
        }

        if (password !== passwordConfirm) {
            showToast(t('passwordsDoNotMatch'), 'error');
            return;
        }

        setLoading(true);
        try {
            await register({ username, displayName, email, password });
            showToast(t('registerSuccess'), 'success');
            router.replace('/(tabs)');
        } catch (e: any) {
            showToast(getLocalizedError(e.message || t('registerError')), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-12">
                <View className="items-center mb-8 mt-4">
                    <View className="flex-row space-x-4 mb-4">
                        <View className="bg-purple-600/20 p-3 rounded-xl border border-purple-500/30">
                            <Book size={32} color="#9333ea" />
                        </View>
                        <View className="bg-blue-600/20 p-3 rounded-xl border border-blue-500/30">
                            <Film size={32} color="#2563eb" />
                        </View>
                    </View>
                    <Text className="text-text-primary text-3xl font-bold mb-2 text-center">{t('createAccount')}</Text>
                    <Text className="text-text-secondary text-base text-center px-4">{t('createAccountDesc')}</Text>
                </View>

                <View className="bg-surface border border-border p-6 rounded-2xl mb-10">
                    <Input
                        label={t('username')}
                        placeholder="kullanici_adi"
                        value={formData.username}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, username: text }))}
                        autoCapitalize="none"
                    />
                    <Input
                        label={t('displayName')}
                        placeholder={t('displayName')}
                        value={formData.displayName}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, displayName: text }))}
                    />
                    <Input
                        label={t('email')}
                        placeholder="ornek@email.com"
                        value={formData.email}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, email: text }))}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <Input
                        label={t('password')}
                        placeholder="••••••••"
                        value={formData.password}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, password: text }))}
                        secureTextEntry
                        autoCapitalize="none"
                        isPasswordVisible={showPasswords}
                        onTogglePassword={() => setShowPasswords(!showPasswords)}
                    />
                    <Input
                        label={t('passwordConfirm')}
                        placeholder="••••••••"
                        value={formData.passwordConfirm}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, passwordConfirm: text }))}
                        secureTextEntry
                        autoCapitalize="none"
                        isPasswordVisible={showPasswords}
                        onTogglePassword={() => setShowPasswords(!showPasswords)}
                    />

                    <Button
                        title={t('registerAction')}
                        onPress={handleRegister}
                        loading={loading}
                        className="mt-4"
                    />

                    <View className="flex-row justify-center mt-6">
                        <Text className="text-text-muted">{t('alreadyHaveAccount')} </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text className="text-purple-500 font-bold">{t('loginAction')}</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
