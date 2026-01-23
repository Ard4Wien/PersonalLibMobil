import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Link, useRouter } from 'expo-router';
import { Book, Film } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { login } = useAuth();
    const router = useRouter();
    const { show: showToast } = useToast();

    const handleLogin = async () => {
        // Prevent multiple clicks
        if (loading) return;

        const newErrors: Record<string, string> = {};
        if (!email.trim()) newErrors.email = 'E-posta adresi zorunludur';
        if (!password.trim()) newErrors.password = 'Şifre zorunludur';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast('Lütfen giriş bilgilerini kontrol edin', 'error');
            return;
        }

        setLoading(true);
        // console.log('[Login] Starting login...');
        try {
            await login({ email: email.trim(), password });
            showToast('Başarıyla giriş yapıldı', 'success');
            router.replace('/(tabs)');
        } catch (e: any) {
            // Sanitize error message to remove technical prefixes like "Error: ..."
            let msg = e.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.';
            msg = msg.replace(/^Error:\s*/i, '').replace(/^\[.*?\]\s*Error:\s*/i, '');

            showToast(msg, 'error');
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
                <View className="items-center mb-10 mt-10">
                    <View className="flex-row space-x-4 mb-4">
                        <View className="bg-purple-600/20 p-3 rounded-2xl border border-purple-500/30">
                            <Book size={32} color="#9333ea" />
                        </View>
                        <View className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
                            <Film size={32} color="#2563eb" />
                        </View>
                    </View>
                    <Text className="text-white text-3xl font-bold mb-2">Hoş Geldiniz</Text>
                    <Text className="text-slate-400 text-base">Medya kütüphanenize giriş yapın</Text>
                </View>

                <View className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
                    <Input
                        label="E-posta"
                        placeholder="ornek@email.com"
                        value={email}
                        error={errors.email}
                        onChangeText={(t: string) => {
                            setEmail(t);
                            if (errors.email) setErrors(p => ({ ...p, email: '' }));
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                    />
                    <Input
                        label="Şifre"
                        placeholder="••••••••"
                        value={password}
                        error={errors.password}
                        onChangeText={(t: string) => {
                            setPassword(t);
                            if (errors.password) setErrors(p => ({ ...p, password: '' }));
                        }}
                        secureTextEntry
                        autoCapitalize="none"
                        editable={!loading}
                    />

                    <View className="flex-row justify-end -mt-3 mb-6">
                        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                            <Text className="text-purple-500/80 text-xs font-medium">Şifremi Unuttum</Text>
                        </TouchableOpacity>
                    </View>

                    <Button
                        title="Giriş Yap"
                        onPress={handleLogin}
                        loading={loading}
                        disabled={loading}
                        className="mt-4"
                    />

                    <View className="flex-row justify-center mt-8">
                        <Text className="text-slate-500">Hesabınız yok mu? </Text>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity disabled={loading}>
                                <Text className="text-purple-500 font-bold">Üye Olun</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                <View className="mt-auto items-center pb-6">
                    <Text className="text-slate-600 text-xs font-medium tracking-tight">PersonalLib Application Framework</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
