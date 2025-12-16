
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                // 1. Fetch User from Supabase
                const { data: userCreds, error } = await supabase
                    .from('user_credentials')
                    .select('*, profiles(full_name, avatar_url)')
                    .eq('email', credentials.email)
                    .single();

                if (error || !userCreds) return null;

                // 2. Validate Password
                const isValid = await bcrypt.compare(credentials.password, userCreds.password_hash);
                if (!isValid) return null;

                // 3. Return User
                // Profile data might be nested or we need to fetch it differently depending on join support
                const profile = userCreds.profiles as any; // Cast for now if Types missing

                return {
                    id: userCreds.user_id,
                    email: userCreds.email,
                    name: profile?.full_name || 'User',
                    image: profile?.avatar_url
                };
            }
        })
    ],
    callbacks: {
        async session({ session, token }: any) {
            console.log("Debug Auth Session Callback - Token:", JSON.stringify(token, null, 2));
            if (session?.user) {
                session.user.id = token.sub;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
}
