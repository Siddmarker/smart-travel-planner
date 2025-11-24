'use client';

import { useEffect, useRef, useState } from 'react';
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
    const [debugInfo, setDebugInfo] = useState<string>('');
    const [clientId, setClientId] = useState<string>('');

    useEffect(() => {
        // Get client ID from environment
        const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

        console.log('🔍 Google OAuth Debug Info:');
        console.log('1. Client ID exists:', !!envClientId);
        console.log('2. Client ID value:', envClientId?.substring(0, 30) + '...');
        console.log('3. Client ID length:', envClientId?.length);
        console.log('4. NODE_ENV:', process.env.NODE_ENV);

        if (!envClientId) {
            const errorMsg = '❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set in environment variables';
            console.error(errorMsg);
            setDebugInfo(errorMsg);
        } else {
            setClientId(envClientId);
            setDebugInfo('✅ Client ID loaded');
        }
    }, []);

    const handleCredentialResponse = async (response: any) => {
        console.log('🔐 Google Auth Response:', {
            hasCredential: !!response.credential,
            credentialLength: response.credential?.length,
            clientId: response.clientId,
            select_by: response.select_by
        });

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

            console.log('✅ Auth success:', data);

            // Store basic user info in localStorage for easy access (optional, as cookie handles auth)
            localStorage.setItem('user_info', JSON.stringify(data.user));

            // Redirect
            router.push('/discover');
            router.refresh();

        } catch (error) {
            console.error('❌ Google auth failed:', error);
            alert('Login failed. Please try again.');
        }
    };

    const initializeGoogleSignIn = () => {
        console.log('🚀 Initializing Google Sign-In...');

        if (!clientId) {
            console.error('❌ Cannot initialize: Client ID is missing');
            setDebugInfo('❌ Client ID is missing. Check environment variables.');
            return;
        }

        if (!window.google?.accounts?.id) {
            console.error('❌ Google SDK not loaded');
            setDebugInfo('❌ Google SDK not loaded');
            return;
        }

        try {
            console.log('✅ Initializing with client_id:', clientId.substring(0, 30) + '...');

            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
                context: 'signin'
            });

            console.log('✅ Google OAuth initialized successfully');

            if (buttonRef.current) {
                window.google.accounts.id.renderButton(
                    buttonRef.current,
                    {
                        theme: 'outline',
                        size: 'large',
                        type: 'standard',
                        text: mode === 'signin' ? 'signin_with' : 'signup_with',
                        width: buttonRef.current.offsetWidth || 300
                    }
                );
                console.log('✅ Google button rendered');
                setDebugInfo('✅ Google Sign-In ready');
            }
        } catch (error) {
            console.error('❌ Failed to initialize Google Sign-In:', error);
            setDebugInfo('❌ Initialization failed: ' + (error as Error).message);
        }
    };

    return (
        <>
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={() => {
                    console.log('✅ Google SDK script loaded');
                    initializeGoogleSignIn();
                }}
                onError={() => {
                    console.error('❌ Failed to load Google SDK script');
                    setDebugInfo('❌ Failed to load Google SDK');
                }}
            />
            <div className="w-full space-y-2">
                {/* Native Google Button Container */}
                <div ref={buttonRef} className="w-full flex justify-center min-h-[44px]" />

                {/* Debug info in development */}
                {process.env.NODE_ENV === 'development' && debugInfo && (
                    <div className="text-xs text-center text-muted-foreground">
                        {debugInfo}
                    </div>
                )}

                {/* Fallback button if Google button doesn't render */}
                {!clientId && (
                    <div className="text-center p-4 border border-destructive rounded-md bg-destructive/10">
                        <p className="text-sm text-destructive font-medium">
                            Google Sign-In Configuration Error
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Please contact support or try again later.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
