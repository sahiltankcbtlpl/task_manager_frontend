import { useToast } from '@chakra-ui/react';

// Custom hook to show toast, or just a component wrapper?
// The prompt says "Toast.jsx". Usually a hook is better in Chakra. 
// But "Toast.jsx" implies a component. 
// However, Chakra's useToast is standard. 
// Maybe a utility or a pre-configured toast component?
// Let's make a simple utility hooks wrapper or a Toast container if needed.
// Actually, let's make a wrapper function that can be imported utils, or keep it simple.
// I will create a simple export that can be used or useToast directly.
// Wait, prompt says "Components -> feedback -> Toast.jsx". 
// I'll make a custom hook that returns a toaster function with preset styles.

import { useCallback } from 'react';

const useCustomToast = () => {
    const toast = useToast();

    const showToast = useCallback((title, description, status = 'success') => {
        toast({
            title,
            description,
            status,
            duration: 5000,
            isClosable: true,
            position: 'top-right',
        });
    }, [toast]);

    return showToast;
};

export default useCustomToast;
