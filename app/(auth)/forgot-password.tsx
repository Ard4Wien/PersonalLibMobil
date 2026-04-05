import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Send } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { show: showToast } = useToast();
    const { t } = useLanguage();

    const handleRequestReset = async () => {
        if (!email.trim()) {
            setError(t('emailRequired'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.auth.forgotPassword(email.trim());
            setIsSubmitted(true);
        } catch (e: any) {
            showToast(e.message || t('error'), 'error');
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
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-slate-900 border border-slate-800 mb-8"
                >
                    <ArrowLeft size={20} color="#94a3b8" />
                </TouchableOpacity>

                {isSubmitted ? (
                    <View className="flex-1 items-center justify-center -mt-20">
                        <View className="bg-green-500/20 p-6 rounded-full border border-green-500/30 mb-6">
                            <Send size={48} color="#22c55e" />
                        </View>
                        <Text className="text-white text-3xl font-bold mb-4">{t('resetLinkSent')}</Text>
                        <Text className="text-slate-400 text-center text-lg mb-8 px-6">
                            {t('resetLinkSentDesc')}
                        </Text>

                        <Button
                            title={t('backToLogin')}
                            onPress={() => router.replace('/(auth)/login')}
                            className="w-full"
                        />
                    </View>
                ) : (
                    <>
                        <View className="items-center mb-10">
                            <View className="bg-purple-600/20 p-4 rounded-3xl border border-purple-500/30 mb-4">
                                <Mail size={40} color="#9333ea" />
                            </View>
                            <Text className="text-white text-3xl font-bold mb-2">{t('forgotPasswordTitle')}</Text>
                            <Text className="text-slate-400 text-center text-base px-10">
                                {t('forgotPasswordDesc')}
                            </Text>
                        </View>

                        <View className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
                            <Input
                                label={t('email')}
                                placeholder="ornek@email.com"
                                value={email}
                                error={error}
                                onChangeText={(t: string) => {
                                    setEmail(t);
                                    if (error) setError('');
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!loading}
                            />

                            <Button
                                title={t('sendResetLink')}
                                onPress={handleRequestReset}
                                loading={loading}
                                icon={<Send size={18} color="white" />}
                                className="mt-2"
                            />
                        </View>
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
