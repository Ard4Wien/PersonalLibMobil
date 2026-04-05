import { MediaStatus } from '@/lib/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StatusOption {
    label: string;
    value: MediaStatus;
}

interface StatusPickerProps {
    options: StatusOption[];
    value: MediaStatus;
    onChange: (value: MediaStatus) => void;
    color?: 'purple' | 'blue' | 'cyan';
    label?: string;
    containerStyle?: string;
}

const COLORS = {
    purple: { bg: '#9333ea', border: '#a855f7' },
    blue: { bg: '#2563eb', border: '#3b82f6' },
    cyan: { bg: '#0891b2', border: '#06b6d4' },
};

export const StatusPicker = ({ options, value, onChange, color = 'purple', label, containerStyle }: StatusPickerProps) => {
    const activeColor = COLORS[color];

    return (
        <View className={`mb-6 ${containerStyle || ''}`}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.optionsRow}>
                {options.map((opt) => {
                    const isActive = value === opt.value;
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            onPress={() => onChange(opt.value)}
                            style={[
                                styles.option,
                                isActive
                                    ? { backgroundColor: activeColor.bg, borderColor: activeColor.border }
                                    : styles.optionInactive
                            ]}
                        >
                            <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        color: 'rgba(148, 163, 184, 0.6)',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    option: {
        marginRight: 8,
        marginBottom: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    optionInactive: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    optionText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '500',
    },
    optionTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
});
