import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Link } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        displayName: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { register } = useAuth();
    const { show: showToast } = useToast();

    const handleRegister = async () => {
        const newErrors: Record<string, string> = {};
        if (!formData.username.trim()) newErrors.username = 'Kullanıcı adı gereklidir';
        if (!formData.email.trim()) newErrors.email = 'E-posta adresi gereklidir';
        if (!formData.password.trim()) newErrors.password = 'Şifre gereklidir';
        if (formData.password.length < 6) newErrors.password = 'Şifre en az 6 karakter olmalıdır';
        if (!formData.displayName.trim()) newErrors.displayName = 'Görünen ad gereklidir';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast('Lütfen bilgilerinizi kontrol edin', 'error');
            return;
        }

        setLoading(true);
        try {
            await register(formData);
            showToast('Hesabınız başarıyla oluşturuldu', 'success');
        } catch (e: any) {
            // Sanitize error message to remove technical prefixes like "Error: ..."
            let msg = e.message || 'Kayıt Olunamadı';
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
                <View className="items-center mb-10 mt-6">
                    <View className="bg-purple-600/20 p-4 rounded-3xl border border-purple-500/30 mb-4">
                        <CheckCircle2 size={40} color="#9333ea" />
                    </View>
                    <Text className="text-white text-3xl font-bold mb-2">Hesap Oluştur</Text>
                    <Text className="text-slate-400 text-base">Kendi kütüphaneni yönetmeye başla</Text>
                </View>

                <View className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
                    <Input
                        label="Kullanıcı Adı"
                        placeholder="arda123"
                        value={formData.username}
                        error={errors.username}
                        onChangeText={(t: string) => {
                            setFormData(p => ({ ...p, username: t }));
                            if (errors.username) setErrors(p => ({ ...p, username: '' }));
                        }}
                        autoCapitalize="none"
                    />
                    <Input
                        label="E-posta"
                        placeholder="ornek@email.com"
                        value={formData.email}
                        error={errors.email}
                        onChangeText={(t: string) => {
                            setFormData(p => ({ ...p, email: t }));
                            if (errors.email) setErrors(p => ({ ...p, email: '' }));
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <Input
                        label="Görünen Ad"
                        placeholder="Arda Yılmaz"
                        value={formData.displayName}
                        error={errors.displayName}
                        onChangeText={(t: string) => {
                            setFormData(p => ({ ...p, displayName: t }));
                            if (errors.displayName) setErrors(p => ({ ...p, displayName: '' }));
                        }}
                    />
                    <Input
                        label="Şifre"
                        placeholder="••••••••"
                        value={formData.password}
                        error={errors.password}
                        onChangeText={(t: string) => {
                            setFormData(p => ({ ...p, password: t }));
                            if (errors.password) setErrors(p => ({ ...p, password: '' }));
                        }}
                        secureTextEntry
                    />

                    <Button
                        title="Kayıt Ol"
                        onPress={handleRegister}
                        loading={loading}
                        className="mt-4"
                    />

                    <View className="flex-row justify-center mt-6">
                        <Text className="text-slate-500">Zaten hesabınız var mı? </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text className="text-purple-500 font-bold">Giriş Yap</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                <View className="py-8 items-center">
                    <Text className="text-slate-600 text-xs">PersonalLib v1.0.0</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
