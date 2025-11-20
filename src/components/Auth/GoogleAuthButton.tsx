'use client';

import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react';
import { signIn } from 'next-auth/react';

interface GoogleAuthButtonProps {
    onGoogleAuth?: () => void;
    isLoading?: boolean;
    mode?: 'signin' | 'signup';
}

export function GoogleAuthButton({ isLoading, mode = 'signin' }: GoogleAuthButtonProps) {
    const handleGoogleSignIn = async () => {
        try {
            console.log('Google sign-in button clicked');
            console.log('Calling signIn with google provider');
            const result = await signIn('google', {
                callbackUrl: '/',
                redirect: true
            });
            console.log('SignIn result:', result);
        } catch (error) {
            console.error('Error during Google sign-in:', error);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
        >
            <Chrome className="mr-2 h-4 w-4" />
            {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
        </Button>
    );
}
