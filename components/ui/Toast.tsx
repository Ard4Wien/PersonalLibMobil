import { AlertCircle, CheckCircle, X } from 'lucide-react-native';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
    show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const getToastColors = (type: ToastType) => {
    switch (type) {
        case 'error':
            return { bg: 'rgba(69, 10, 10, 0.95)', border: 'rgba(239, 68, 68, 0.5)', icon: '#ef4444' };
        case 'success':
            return { bg: 'rgba(5, 46, 22, 0.95)', border: 'rgba(34, 197, 94, 0.5)', icon: '#22c55e' };
        default:
            return { bg: 'rgba(15, 23, 42, 0.95)', border: 'rgba(71, 85, 105, 0.5)', icon: '#3b82f6' };
    }
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
    const [opacity] = useState(new Animated.Value(0));

    const hide = useCallback(() => {
        Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setToast(null));
    }, [opacity]);

    const show = useCallback((message: string, type: ToastType = 'info') => {
        setToast({ message, type });
        Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        setTimeout(hide, 4000);
    }, [opacity, hide]);

    const colors = toast ? getToastColors(toast.type) : null;

    return (
        <ToastContext.Provider value={{ show }}>
            {children}
            {toast && colors && (
                <Animated.View style={[styles.container, { opacity }]}>
                    <View style={[styles.toast, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                        <View style={styles.iconContainer}>
                            {toast.type === 'error' ? <AlertCircle size={24} color={colors.icon} /> :
                                toast.type === 'success' ? <CheckCircle size={24} color={colors.icon} /> :
                                    <AlertCircle size={24} color={colors.icon} />}
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.message}>{toast.message}</Text>
                        </View>
                        <TouchableOpacity onPress={hide} style={styles.closeButton}>
                            <X size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 40,
        left: 24,
        right: 24,
        zIndex: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    message: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
    },
    closeButton: {
        marginLeft: 8,
        padding: 4,
    },
});

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};
