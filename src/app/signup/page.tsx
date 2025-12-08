'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GoogleAuthButton } from '@/components/Auth/GoogleAuthButton';
import { useAuth } from '@/contexts/AuthContext'; // Changed from useStore
import { Plane, Mail, Lock, User, AlertCircle, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SignupPage() {
    const router = useRouter();
    const { signup, error: authError, clearError } = useAuth(); // Use useAuth hook

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Password strength checker
    const getPasswordStrength = (pwd: string) => {
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
        if (/\d/.test(pwd)) strength++;
        if (/[^a-zA-Z\d]/.test(pwd)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(formData.password);
    const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;

    // ✅ FIXED: Enhanced form validation
    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await signup({
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            if (result.success) {
                // ✅ CRITICAL: Show success message
                // In a real app, you might use a toast notification here
                alert('Account created successfully! Redirecting to dashboard...');

                // ✅ CRITICAL: Navigate to dashboard AFTER successful signup
                router.replace('/dashboard');
            } else {
                // Show error but don't redirect
                // Error is already set in context, but we can also alert if needed
                // alert(result.error || 'Signup failed');
            }
        } catch (error: any) {
            console.error('Signup error:', error);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignup = async () => {
        // GoogleAuthButton already handles the state update
        // We just need to redirect
        console.log('Google signup successful, redirecting to dashboard');
        router.push('/dashboard');
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
                    {/* Display Auth Error from Context */}
                    {authError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{authError}</AlertDescription>
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
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`pl-10 ${validationErrors.name ? 'border-red-500' : ''}`}
                                    disabled={isSubmitting}
                                />
                            </div>
                            {validationErrors.name && (
                                <span className="text-xs text-red-500">{validationErrors.name}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`pl-10 ${validationErrors.email ? 'border-red-500' : ''}`}
                                    disabled={isSubmitting}
                                />
                            </div>
                            {validationErrors.email && (
                                <span className="text-xs text-red-500">{validationErrors.email}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className={`pl-10 ${validationErrors.password ? 'border-red-500' : ''}`}
                                    disabled={isSubmitting}
                                />
                            </div>
                            {validationErrors.password && (
                                <span className="text-xs text-red-500">{validationErrors.password}</span>
                            )}

                            {formData.password && (
                                <div className="space-y-1 mt-2">
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
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className={`pl-10 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
                                    disabled={isSubmitting}
                                />
                                {formData.confirmPassword && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        {passwordsMatch ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-500" />
                                        )}
                                    </div>
                                )}
                            </div>
                            {validationErrors.confirmPassword && (
                                <span className="text-xs text-red-500">{validationErrors.confirmPassword}</span>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating Account...' : 'Create Account'}
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
