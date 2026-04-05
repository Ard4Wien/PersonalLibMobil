import { Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface InputProps extends React.ComponentProps<typeof TextInput> {
    label?: string;
    error?: string;
    rightIcon?: React.ReactNode;
    rightElement?: React.ReactNode;
    containerStyle?: string;
    isPasswordVisible?: boolean;
    onTogglePassword?: () => void;
}

export const Input = ({ label, error, secureTextEntry, rightIcon, rightElement, containerStyle, isPasswordVisible, onTogglePassword, ...props }: InputProps) => {
    const [internalIsVisible, setInternalIsVisible] = useState(false);

    const isVisible = isPasswordVisible !== undefined ? isPasswordVisible : internalIsVisible;
    const toggleVisibility = onTogglePassword || (() => setInternalIsVisible(!internalIsVisible));

    const isPassword = !!secureTextEntry;

    return (
        <View className={`mb-5 ${containerStyle || ''}`}>
            {label && (
                <Text className={`mb-1.5 text-xs font-bold uppercase tracking-widest opacity-60 ${error ? 'text-red-400' : 'text-text-secondary'}`}>
                    {label}
                </Text>
            )}
            <View className={`flex-row items-center bg-surface-light border rounded-xl px-4 ${error ? 'border-red-500/50 bg-red-500/5' : 'border-border'
                } focus:border-purple-500/50`}>
                <TextInput
                    {...props}
                    secureTextEntry={isPassword ? !isVisible : false}
                    placeholderTextColor="#94a3b8"
                    className="flex-1 text-text-primary py-3.5 text-base"
                    style={{ letterSpacing: 0 }}
                />

                {(isPassword || rightIcon || rightElement) && (
                    <View className="items-center justify-center pl-2">
                        {isPassword ? (
                            <TouchableOpacity
                                onPress={toggleVisibility}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                {isVisible ? (
                                    <EyeOff size={20} color="#94a3b8" />
                                ) : (
                                    <Eye size={20} color="#94a3b8" />
                                )}
                            </TouchableOpacity>
                        ) : (
                            rightIcon || rightElement
                        )}
                    </View>
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
