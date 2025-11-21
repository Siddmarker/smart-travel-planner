// Mock authentication utilities
// In production, replace with real backend API calls

interface StoredUser {
    id: string;
    name: string;
    email: string;
    password: string; // In production, this would be hashed on backend
    avatar?: string;
    createdAt: string;
}

// Simple hash function (NOT secure, for demo only)
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

export function hashPassword(password: string): string {
    // In production, use bcrypt or similar
    return simpleHash(password + 'salt_key_2024');
}

export function getStoredUsers(): StoredUser[] {
    if (typeof window === 'undefined') return [];
    const users = localStorage.getItem('travel_planner_users');
    if (!users) {
        // Seed default user
        const defaultUser: StoredUser = {
            id: 'user-default',
            name: 'Test User',
            email: 'test@example.com',
            password: hashPassword('password123'),
            avatar: 'https://github.com/shadcn.png',
            createdAt: new Date().toISOString(),
        };
        localStorage.setItem('travel_planner_users', JSON.stringify([defaultUser]));
        return [defaultUser];
    }
    return JSON.parse(users);
}

export function saveUser(user: StoredUser): void {
    const users = getStoredUsers();
    users.push(user);
    localStorage.setItem('travel_planner_users', JSON.stringify(users));
}

export function findUserByEmail(email: string): StoredUser | null {
    const users = getStoredUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function validateCredentials(email: string, password: string): StoredUser | null {
    const user = findUserByEmail(email);
    if (!user) return null;

    const hashedPassword = hashPassword(password);
    if (user.password === hashedPassword) {
        return user;
    }
    return null;
}

export function createUser(name: string, email: string, password: string): StoredUser {
    const user: StoredUser = {
        id: `user-${Date.now()}`,
        name,
        email,
        password: hashPassword(password),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        createdAt: new Date().toISOString(),
    };

    saveUser(user);
    return user;
}

export function setAuthToken(userId: string): void {
    // In production, this would be a JWT token
    const token = {
        userId,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    };
    localStorage.setItem('travel_planner_token', JSON.stringify(token));
}

export function getAuthToken(): { userId: string; expiresAt: number } | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('travel_planner_token');
    if (!token) return null;

    const parsed = JSON.parse(token);
    if (parsed.expiresAt < Date.now()) {
        clearAuthToken();
        return null;
    }

    return parsed;
}

export function clearAuthToken(): void {
    localStorage.removeItem('travel_planner_token');
}

export function getUserFromToken(): StoredUser | null {
    const token = getAuthToken();
    if (!token) return null;

    const users = getStoredUsers();
    return users.find(u => u.id === token.userId) || null;
}

// Mock Google OAuth (in production, use real OAuth)
export async function mockGoogleLogin(): Promise<StoredUser> {
    // Simulate OAuth flow
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockGoogleUser: StoredUser = {
                id: `user-google-${Date.now()}`,
                name: 'Google User',
                email: `user${Date.now()}@gmail.com`,
                password: '', // No password for OAuth users
                avatar: 'https://lh3.googleusercontent.com/a/default-user',
                createdAt: new Date().toISOString(),
            };

            // Check if user already exists
            const existing = findUserByEmail(mockGoogleUser.email);
            if (existing) {
                resolve(existing);
            } else {
                saveUser(mockGoogleUser);
                resolve(mockGoogleUser);
            }
        }, 1000);
    });
}
