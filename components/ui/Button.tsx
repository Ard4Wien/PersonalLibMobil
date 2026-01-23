import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { BrandGradient } from './BrandGradient';

export const Button = ({ title, onPress, loading, className, disabled }: any) => (
    <TouchableOpacity
        onPress={onPress}
        disabled={loading || disabled}
        className={`rounded-lg overflow-hidden ${className} ${disabled ? 'opacity-50' : ''}`}
    >
        <BrandGradient className="py-3 px-6 items-center justify-center">
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text className="text-white font-bold text-base">{title}</Text>
            )}
        </BrandGradient>
    </TouchableOpacity>
);
