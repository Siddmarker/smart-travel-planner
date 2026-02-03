'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

function AuthErrorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [errorDetails, setErrorDetails] = useState<string>('');

    useEffect(() => {
        // Extract error details from URL params
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const errorCode = searchParams.get('error_code');

        // Log error details for debugging
        console.error('🚨 Authentication Error:', {
            error,
            errorDescription,
            errorCode,
            timestamp: new Date().toISOString(),
            url: window.location.href,
        });

        // Set user-friendly error message
        if (errorDescription) {
            setErrorDetails(errorDescription);
        } else if (error) {
            setErrorDetails(error);
        } else {
            setErrorDetails('An unknown error occurred during authentication.');
        }
    }, [searchParams]);

    const handleRetry = () => {
        // Clear any existing auth state and redirect to landing page
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                {/* Error Icon */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-8 h-8 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                {/* Error Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Authentication Failed
                </h1>

                {/* Error Description */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                    We couldn't complete your sign-in request. This might be due to:
                </p>

                <ul className="text-left text-sm text-gray-600 mb-6 space-y-2 bg-gray-50 rounded-lg p-4">
                    <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>The authentication request was cancelled or expired</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>A temporary network issue occurred</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>Your browser blocked third-party cookies</span>
                    </li>
                </ul>

                {/* Technical Details (if available) */}
                {errorDetails && (
                    <details className="text-left mb-6">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 mb-2">
                            Technical Details
                        </summary>
                        <div className="bg-gray-100 rounded-lg p-3 text-xs font-mono text-gray-700 break-all">
                            {errorDetails}
                        </div>
                    </details>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleRetry}
                        className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                    >
                        Try Again
                    </button>

                    <a
                        href="mailto:support@2wards.in"
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Need help? Contact Support
                    </a>
                </div>

                {/* Additional Help */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        <strong>Tip:</strong> Make sure third-party cookies are enabled in your browser settings.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function AuthCodeErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <AuthErrorContent />
        </Suspense>
    );
}
