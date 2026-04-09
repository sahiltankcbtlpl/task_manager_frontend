import { extendTheme } from '@chakra-ui/react';

const colors = {
    brand: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#1e1b4b',
    },
};

const theme = extendTheme({
    colors,
    shadows: {
        soft: '0 2px 10px rgba(0, 0, 0, 0.05)',
        premium: '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 12px -5px rgba(0, 0, 0, 0.04)',
    },
    styles: {
        global: {
            body: {
                bg: 'gray.50',
                color: 'gray.800',
            },
        },
    },
    components: {
        Button: {
            baseStyle: {
                borderRadius: 'lg',
                fontWeight: 'semibold',
            },
            defaultProps: {
                colorScheme: 'brand',
            },
        },
        Card: {
            baseStyle: {
                container: {
                    borderRadius: 'xl',
                    shadow: 'soft',
                },
            },
        },
        Input: {
            defaultProps: {
                focusBorderColor: 'brand.500',
            },
        },
    },
});

export default theme;
