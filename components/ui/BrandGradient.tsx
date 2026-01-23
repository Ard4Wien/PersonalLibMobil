import { LinearGradient } from 'expo-linear-gradient';

export const BrandGradient = ({ children, style, className }: any) => (
    <LinearGradient
        colors={['#9333ea', '#db2777']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={style}
        className={className}
    >
        {children}
    </LinearGradient>
);
