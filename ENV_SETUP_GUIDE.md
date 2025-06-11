# ENVIRONMENT SETUP GUIDE

## 🚨 IMPORTANT: Create .env.local file

You need to create a file named '.env.local' in the root directory (same level as package.json) with the following content:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

## 📝 How to get these values:

1. Go to https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Go to Settings -> API
4. Copy the URL and anon key values

## 🗺️ How to get Google Maps API Key:

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable "Geocoding API" in the API Library
4. Go to "Credentials" and create an API Key
5. Copy the API key

## 🔧 Example .env.local content:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_MAPS_API_KEY=AIzaSy...your-actual-key
```

## ⚠️ Important Notes:
- No spaces around the = sign
- No quotes around the values  
- File must be named exactly '.env.local'
- File must be in root directory (same level as package.json)
- Restart the development server after creating the file

## 🧪 Test Setup:

After creating the .env.local file, run:
```bash
npm run dev
```

If you see errors about missing environment variables, double-check:
1. File name is exactly '.env.local'
2. File is in the correct directory
3. No typos in variable names
4. Values are correct from Supabase dashboard 