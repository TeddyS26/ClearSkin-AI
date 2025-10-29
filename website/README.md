# ClearSkin AI Website

This is the official website for ClearSkin AI, an AI-powered skin analysis mobile application.

## Pages

- **Home** (`index.html`) - Main landing page with app overview and features
- **About** (`about.html`) - Information about the app and team
- **Contact** (`contact.html`) - Contact form and support information
- **Privacy Policy** (`privacy-policy.html`) - Legal privacy policy
- **Terms of Service** (`terms-of-service.html`) - Legal terms and conditions

## Features

- Responsive design for all devices
- Modern, clean UI with professional styling
- Contact form with validation
- Mobile-friendly navigation
- SEO optimized
- Accessibility features

## Deployment

### Option 1: Static Hosting (Recommended)
Deploy to any static hosting service:

- **Netlify**: Drag and drop the `website` folder
- **Vercel**: Connect your GitHub repository
- **GitHub Pages**: Push to a GitHub repository
- **Cloudflare Pages**: Upload files directly

### Option 2: Cloudflare Pages
1. Create a new Cloudflare Pages project
2. Upload the `website` folder contents
3. Configure custom domain if needed

## Environment Variables for App

For hosting environment variables for your React Native app, consider these options:

### 1. Cloudflare Workers (Recommended)
- Store environment variables securely
- Access via API calls from your app
- Built-in security and scaling

### 2. Supabase (Already using)
- Store secrets in Supabase dashboard
- Access via Supabase client in your app
- Built-in authentication and database

### 3. Firebase Functions
- Store environment variables in Firebase
- Access via Firebase Functions
- Good integration with React Native

### 4. AWS Systems Manager Parameter Store
- Secure parameter storage
- Access via AWS SDK
- Enterprise-grade security

## Contact

Email: contact@clearskinai.ca
Location: Ontario, Canada
