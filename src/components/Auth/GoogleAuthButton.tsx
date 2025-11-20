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
    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl: '/' });
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
