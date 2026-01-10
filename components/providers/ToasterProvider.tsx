"use client";

import { Toaster as SonnerToaster } from 'sonner';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export function ToasterProvider() {
    const isMobile = useMediaQuery('(max-width: 768px)');

    return (
        <SonnerToaster
            position={isMobile ? "top-center" : "bottom-right"}
            richColors
            toastOptions={{
                className: isMobile ? 'mobile-toast' : '',
            }}
        />
    );
}
