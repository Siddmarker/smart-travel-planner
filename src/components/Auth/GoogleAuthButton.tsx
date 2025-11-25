'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { setAuthToken } from '@/lib/auth';

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
    const { setCurrentUser } = useStore();
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
                // Update AuthContext (Legacy/Context)
                login(data.user, data.token);

                // Update Zustand Store (Main State)
                setAuthToken(data.user.id);
                setCurrentUser({
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    avatar: data.user.picture || data.user.avatar || '',
                    // Add other required fields if necessary, or cast
                } as any);

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
        // Check if Google Identity Services is already loaded
        if (window.google?.accounts?.id) {
            console.log('✅ Google Identity Services already loaded');
            setIsGoogleLoaded(true);
            return;
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!apiKey) {
            console.error('Google Client ID is missing');
            return;
        }

        console.log('🔄 Loading Google Identity Services...');

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;

        script.onload = () => {
            console.log('✅ Google Identity Services script loaded');
            // Add a small delay to ensure everything is initialized
            setTimeout(() => {
                if (window.google?.accounts?.id) {
                    console.log('✅ Google accounts.id is now available');
                    setIsGoogleLoaded(true);
                } else {
                    console.error('❌ Google accounts.id still not available after load');
                }
            }, 100);
        };

        script.onerror = (error) => {
            console.error('❌ Failed to load Google Identity Services:', error);
        };

        document.head.appendChild(script);

        return () => {
            // Cleanup
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        if (isGoogleLoaded && clientId) {
            console.log('🔄 Initializing Google button...');

            // Double-check that google.accounts.id exists
            if (!window.google?.accounts?.id) {
                console.error('❌ Google accounts.id is not available for initialization');
                return;
            }

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

                console.log('✅ Google button initialized successfully');
            } catch (error: any) {
                console.error('❌ Google button initialization failed:', error);
                // Check for common initialization errors
                if (error?.message?.includes('origin_mismatch')) {
                    console.error('⚠️ Origin Mismatch Error: The current domain is not listed in the Google Cloud Console "Authorized JavaScript Origins".');
                }
            }
        }
    }, [isGoogleLoaded, clientId, mode]);

    if (!clientId) {
        console.warn('Google Client ID is missing');
        return null;
    }

    return (
        <div className="w-full flex flex-col items-center justify-center space-y-2">
            {isLoading && (
                <div className="text-sm text-muted-foreground animate-pulse">
                    {mode === 'signup' ? 'Creating your account...' : 'Signing you in...'}
                </div>
            )}
            <div id="googleSignInContainer" className="min-h-[50px]"></div>

            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    Google Loaded: {isGoogleLoaded ? '✅' : '❌'}
                </div>
            )}
        </div>
    );
}
