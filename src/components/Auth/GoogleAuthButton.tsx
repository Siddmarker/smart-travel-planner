import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { setAuthToken, saveUser } from '@/lib/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
    const [initError, setInitError] = useState<string | null>(null);
    const router = useRouter();
    const { login } = useAuth();
    const { setCurrentUser } = useStore();
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const handleCredentialResponse = async (response: any) => {
        setIsLoading(true);
        setInitError(null);
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
                // Persist user to localStorage so checkAuth works on reload
                // data.user comes from API, and saveUser handles client-side storage
                saveUser({
                    ...data.user,
                    password: '', // API doesn't return password, set empty
                });

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
                    router.push(data.redirectTo || '/dashboard');
                }
            } else {
                const errorMsg = data.details || data.error || 'Login failed';
                console.error('Authentication failed:', errorMsg);
                setInitError(errorMsg);

                if (onError) {
                    onError(errorMsg);
                }
            }
        } catch (error: any) {
            console.error('Network error:', error);
            const errorMsg = 'Login failed. Please try again.';
            setInitError(errorMsg);

            if (onError) {
                onError(errorMsg);
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
            setInitError('Configuration Error: Google Client ID is missing in environment variables.');
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
                    setInitError('Failed to initialize Google Sign-In script.');
                }
            }, 100);
        };

        script.onerror = (error) => {
            console.error('❌ Failed to load Google Identity Services:', error);
            setInitError('Failed to load Google Sign-In script. Please check your internet connection.');
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
                setInitError(`Google Sign-In Error: ${error.message || 'Initialization failed'}`);

                // Check for common initialization errors
                if (error?.message?.includes('origin_mismatch')) {
                    const msg = 'Origin Mismatch: The current domain is not authorized in Google Cloud Console.';
                    console.error('⚠️ ' + msg);
                    setInitError(msg);
                }
            }
        }
    }, [isGoogleLoaded, clientId, mode]);

    if (!clientId) {
        return (
            <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuration Error</AlertTitle>
                <AlertDescription>
                    Google Client ID is missing. Please check your .env.local file.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="w-full flex flex-col items-center justify-center space-y-2">
            {initError && (
                <Alert variant="destructive" className="mb-4 w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Sign-In Error</AlertTitle>
                    <AlertDescription>{initError}</AlertDescription>
                </Alert>
            )}

            {isLoading && (
                <div className="text-sm text-muted-foreground animate-pulse mb-2">
                    {mode === 'signup' ? 'Creating your account...' : 'Signing you in...'}
                </div>
            )}

            <div id="googleSignInContainer" className="min-h-[50px]"></div>

            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{ fontSize: '10px', color: '#999', marginTop: '5px' }}>
                    Status: {isGoogleLoaded ? 'Loaded' : 'Loading...'} | Client ID: {clientId ? 'Present' : 'Missing'}
                </div>
            )}
        </div>
    );
}
