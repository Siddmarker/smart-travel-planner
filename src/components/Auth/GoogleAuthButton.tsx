'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

declare global {
    interface Window {
        google: any;
    }
}

interface GoogleAuthButtonProps {
    mode?: 'signin' | 'signup';
    onSuccess?: (user: any) => void;
    onError?: (error: any) => void;
}

export function GoogleAuthButton({
    mode = 'signin',
    onSuccess,
    onError
}: GoogleAuthButtonProps) {
    const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const handleCredentialResponse = async (response: any) => {
        setIsLoading(true);
        try {
            const authResult = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
            });

            const data = await authResult.json();

            if (data.success) {
                login(data.user, data.token);

                if (onSuccess) {
                    onSuccess(data.user);
                } else {
                    window.location.href = data.redirectTo || '/dashboard';
                }
            } else {
                const errorMsg = data.details || data.error || 'Login failed';
                console.error('Authentication failed:', errorMsg);

                if (onError) {
                    onError(errorMsg);
                } else {
                    alert('Login failed: ' + errorMsg);
                }
            }
        } catch (error: any) {
            console.error('Network error:', error);
            const errorMsg = 'Login failed. Please try again.';

            if (onError) {
                onError(errorMsg);
            } else {
                alert(errorMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (window.google) {
            setIsGoogleLoaded(true);
        } else {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => setIsGoogleLoaded(true);
            document.head.appendChild(script);
        }
    }, []);

    useEffect(() => {
        if (isGoogleLoaded && clientId && window.google) {
            try {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleCredentialResponse,
                });

                const container = document.getElementById('googleSignInContainer');
                if (container) {
                    window.google.accounts.id.renderButton(
                        container,
                        {
                            theme: 'outline',
                            size: 'large',
                            text: mode === 'signup' ? 'signup_with' : 'continue_with',
                            width: 300
                        }
                    );
                }
            } catch (error) {
                console.error('Google button initialization failed:', error);
            }
        }
    }, [isGoogleLoaded, clientId, mode]);

    if (!clientId) return null;

    return (
        <div className="w-full flex flex-col items-center justify-center space-y-2">
            {isLoading && (
                <div className="text-sm text-muted-foreground animate-pulse">
                    {mode === 'signup' ? 'Creating your account...' : 'Signing you in...'}
                </div>
            )}
            <div id="googleSignInContainer" className="min-h-[50px]"></div>
        </div>
    );
}
