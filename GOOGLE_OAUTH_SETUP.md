# Google OAuth Setup Instructions

## Critical: Missing Environment Variable

The Google Sign-In button requires `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to be set.

### Local Development Setup

1. Create or edit `.env.local` in the project root:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here
```

2. Get your Google Client ID from [Google Cloud Console](https://console.cloud.google.com/):
   - Go to "APIs & Services" > "Credentials"
   - Find your OAuth 2.0 Client ID
   - Copy the Client ID (it should end with `.apps.googleusercontent.com`)

3. Restart your development server:
```bash
npm run dev
```

### Production (Vercel) Setup

1. Go to your Vercel project dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add the following variables:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = your_client_id
   - `GOOGLE_CLIENT_SECRET` = your_client_secret
   - `NEXTAUTH_SECRET` = your_secret_key

4. Redeploy your application

### Google Cloud Console Configuration

Ensure these settings in Google Cloud Console:

**Authorized JavaScript origins:**
- `http://localhost:3000` (development)
- `https://your-domain.vercel.app` (production)

**Authorized redirect URIs:**
- `http://localhost:3000/api/auth/callback/google`
- `https://your-domain.vercel.app/api/auth/callback/google`

### Debugging

The updated GoogleAuthButton now includes comprehensive debugging:
- Check browser console for detailed logs
- Look for messages starting with 🔍, ✅, or ❌
- In development mode, debug info will appear below the button

### Common Issues

1. **"Missing client_id" error**: Environment variable not set or not prefixed with `NEXT_PUBLIC_`
2. **Button doesn't appear**: Check browser console for errors
3. **Authentication fails**: Verify redirect URIs in Google Cloud Console match your domain exactly
