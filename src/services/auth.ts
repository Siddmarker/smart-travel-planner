
export interface SignupData {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    user?: {
        id: string;
        name: string;
        email: string;
        token?: string;
    };
    token?: string;
    error?: string;
    message?: string;
}

export const authService = {
    async signup(userData: SignupData): Promise<AuthResponse> {
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Signup failed');
            }

            return {
                success: true,
                user: {
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    token: data.token,
                },
                token: data.token,
                message: 'Account created successfully!'
            };

        } catch (error: any) {
            console.error('Signup error:', error);
            return {
                success: false,
                error: error.message || 'Signup failed. Please try again.'
            };
        }
    }
};
