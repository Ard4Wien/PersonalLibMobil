import { Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export const Input = ({ label, error, secureTextEntry, ...props }: any) => {
    const [isVisible, setIsVisible] = useState(false);
    const isPassword = !!secureTextEntry;

    return (
        <View className="mb-5">
            {label && (
                <Text className={`mb-1.5 text-xs font-bold uppercase tracking-widest opacity-60 ${error ? 'text-red-400' : 'text-text-secondary'}`}>
                    {label}
                </Text>
            )}
            <View className="relative justify-center">
                <TextInput
                    {...props}
                    secureTextEntry={isPassword ? !isVisible : false}
                    placeholderTextColor="#475569"
                    className={`bg-slate-900 border text-white rounded-xl px-4 py-3.5 text-base ${error ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'
                        } focus:border-purple-500/50 ${isPassword ? 'pr-12' : ''}`}
                />
                {isPassword && (
                    <TouchableOpacity
                        onPress={() => setIsVisible(!isVisible)}
                        className="absolute right-3 p-2"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        {isVisible ? (
                            <EyeOff size={20} color="#94a3b8" />
                        ) : (
                            <Eye size={20} color="#94a3b8" />
                        )}
                    </TouchableOpacity>
                )}
            </View>
            {error && (
                <View className="flex-row items-center mt-1.5 ml-1">
                    <Text className="text-red-500 text-[11px] font-bold">{error}</Text>
                </View>
            )}
        </View>
    );
};
