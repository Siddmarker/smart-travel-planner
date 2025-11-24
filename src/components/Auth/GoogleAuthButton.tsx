'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react';

interface GoogleAuthButtonProps {
    onGoogleAuth?: () => void;
    isLoading?: boolean;
    mode?: 'signin' | 'signup';
}

declare global {
    interface Window {
        google: any;
    }
}

export function GoogleAuthButton({ isLoading, mode = 'signin' }: GoogleAuthButtonProps) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const handleCredentialResponse = async (response: any) => {
        console.log('Google Auth Response:', response);

        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    credential: response.credential,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            console.log('Auth success:', data);

            // Store basic user info in localStorage for easy access (optional, as cookie handles auth)
            localStorage.setItem('user_info', JSON.stringify(data.user));

            // Redirect
            router.push('/discover'); // Or dashboard
            router.refresh();

        } catch (error) {
            console.error('Google auth failed:', error);
            alert('Login failed. Please try again.');
        }
    };

    const initializeGoogleSignIn = () => {
        if (window.google?.accounts?.id) {
            window.google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '', // Ensure this env var is exposed
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true
            });

            if (buttonRef.current) {
                window.google.accounts.id.renderButton(
                    buttonRef.current,
                    {
                        theme: 'outline',
                        size: 'large',
                        type: 'standard',
                        text: mode === 'signin' ? 'signin_with' : 'signup_with',
                        width: '100%'
                    }
                );
            }
        }
    };

    return (
        <>
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={initializeGoogleSignIn}
            />
            <div className="w-full">
                {/* Native Google Button Container */}
                <div ref={buttonRef} className="w-full flex justify-center" />

                {/* Fallback or loading state if needed */}
                {!buttonRef.current && (
                    <div className="text-center text-sm text-muted-foreground mt-2">
                        Loading Google Sign-In...
                    </div>
                )}
            </div>
        </>
    );
}
