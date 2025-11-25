'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GoogleAuthButton } from '@/components/Auth/GoogleAuthButton';
import { useStore } from '@/store/useStore';
import { Plane, Mail, Lock, User, AlertCircle, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SignupPage() {
    const router = useRouter();
    const { signup, loginWithGoogle } = useStore();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Password strength checker
    const getPasswordStrength = (pwd: string) => {
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
        if (/\d/.test(pwd)) strength++;
        if (/[^a-zA-Z\d]/.test(pwd)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(password);
    const passwordsMatch = password === confirmPassword && password.length > 0;

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await signup(name, email, password);
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Signup failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        setIsLoading(true);

        try {
            await loginWithGoogle();
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Google signup failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
                            <Plane className="h-6 w-6 text-primary-foreground" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                    <CardDescription>
                        Start planning your next adventure today
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            {password && (
                                <div className="space-y-1">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1 flex-1 rounded ${level <= passwordStrength
                                                    ? passwordStrength === 1
                                                        ? 'bg-red-500'
                                                        : passwordStrength === 2
                                                            ? 'bg-yellow-500'
                                                            : passwordStrength === 3
                                                                ? 'bg-blue-500'
                                                                : 'bg-green-500'
                                                    : 'bg-gray-200'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {passwordStrength === 1 && 'Weak password'}
                                        {passwordStrength === 2 && 'Fair password'}
                                        {passwordStrength === 3 && 'Good password'}
                                        {passwordStrength === 4 && 'Strong password'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                    disabled={isLoading}
                                />
                                {confirmPassword && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        {passwordsMatch ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-500" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading || !passwordsMatch}>
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <GoogleAuthButton
                        onSuccess={handleGoogleSignup}
                        mode="signup"
                    />
                </CardContent>

                <CardFooter className="flex flex-col space-y-2">
                    <div className="text-sm text-center text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Sign in
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
