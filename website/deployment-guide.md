# ClearSkin AI - Deployment Guide

## Website Deployment

### Option 1: Cloudflare Pages (Recommended)
1. **Create Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Access Pages**: Go to Pages in your Cloudflare dashboard
3. **Create Project**: Click "Create a project" → "Upload assets"
4. **Upload Files**: Drag and drop the entire `website` folder contents
5. **Configure**: 
   - Project name: `clearskin-ai-website`
   - Production branch: `main`
6. **Deploy**: Click "Deploy site"
7. **Custom Domain** (Optional): Add your domain in the Custom domains section

### Option 2: Netlify
1. **Create Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **Drag & Drop**: Drag the `website` folder to Netlify's deploy area
3. **Configure**: 
   - Site name: `clearskin-ai-website`
   - Build command: (leave empty for static site)
   - Publish directory: `website`
4. **Deploy**: Site will be automatically deployed

### Option 3: Vercel
1. **Create Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Import Project**: Connect your GitHub repository
3. **Configure**: 
   - Framework Preset: Other
   - Root Directory: `website`
4. **Deploy**: Click deploy

## Environment Variables Hosting for React Native App

### Option 1: Cloudflare Workers (Recommended)

#### Setup Cloudflare Workers for Environment Variables
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create a new Worker project
wrangler generate env-api
cd env-api
```

#### Create Worker Script
```javascript
// src/index.js
export default {
  async fetch(request, env) {
    // Add CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow GET requests for security
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    // Verify request (add your own authentication logic)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Return environment variables
    const envVars = {
      SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
      OPENAI_API_KEY: env.OPENAI_API_KEY,
      STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY,
      RESEND_API_KEY: env.RESEND_API_KEY,
    };

    return new Response(JSON.stringify(envVars), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  },
};
```

#### Configure wrangler.toml
```toml
name = "env-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
# Non-sensitive variables can go here
API_VERSION = "1.0.0"
```

#### Set Secrets
```bash
# Set sensitive environment variables as secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put STRIPE_PUBLISHABLE_KEY
wrangler secret put RESEND_API_KEY
```

#### Deploy Worker
```bash
wrangler deploy
```

#### Update React Native App
```javascript
// lib/config.js
const getEnvVars = async () => {
  try {
    const response = await fetch('https://your-worker.your-subdomain.workers.dev/', {
      headers: {
        'Authorization': 'Bearer YOUR_APP_SECRET_KEY',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch environment variables');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching env vars:', error);
    // Fallback to hardcoded values or handle error
    return {};
  }
};

export default getEnvVars;
```

### Option 2: Supabase (Already Using)

#### Store Secrets in Supabase
1. **Go to Supabase Dashboard** → Your Project → Settings → API
2. **Create a secrets table**:
```sql
CREATE TABLE app_secrets (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert your secrets (do this securely)
INSERT INTO app_secrets (key, value) VALUES 
('OPENAI_API_KEY', 'your-openai-key'),
('STRIPE_SECRET_KEY', 'your-stripe-secret'),
('RESEND_API_KEY', 'your-resend-key');
```

#### Create RPC Function
```sql
CREATE OR REPLACE FUNCTION get_app_secrets()
RETURNS TABLE(key TEXT, value TEXT) AS $$
BEGIN
  RETURN QUERY SELECT app_secrets.key, app_secrets.value FROM app_secrets;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Update React Native App
```javascript
// lib/config.js
import { supabase } from './supabase';

const getEnvVars = async () => {
  try {
    const { data, error } = await supabase.rpc('get_app_secrets');
    
    if (error) {
      throw error;
    }
    
    const envVars = {};
    data.forEach(item => {
      envVars[item.key] = item.value;
    });
    
    return envVars;
  } catch (error) {
    console.error('Error fetching env vars:', error);
    return {};
  }
};

export default getEnvVars;
```

### Option 3: Firebase Functions

#### Setup Firebase Functions
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init functions
```

#### Create Environment Function
```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.getEnvVars = functions.https.onRequest((req, res) => {
  // Add CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  // Verify authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).send('Unauthorized');
    return;
  }

  // Return environment variables
  const envVars = {
    SUPABASE_URL: functions.config().supabase.url,
    SUPABASE_ANON_KEY: functions.config().supabase.anon_key,
    OPENAI_API_KEY: functions.config().openai.api_key,
    STRIPE_PUBLISHABLE_KEY: functions.config().stripe.publishable_key,
    RESEND_API_KEY: functions.config().resend.api_key,
  };

  res.json(envVars);
});
```

#### Set Environment Variables
```bash
firebase functions:config:set supabase.url="your-supabase-url"
firebase functions:config:set supabase.anon_key="your-supabase-key"
firebase functions:config:set openai.api_key="your-openai-key"
firebase functions:config:set stripe.publishable_key="your-stripe-key"
firebase functions:config:set resend.api_key="your-resend-key"
```

#### Deploy
```bash
firebase deploy --only functions
```

## Security Best Practices

### 1. Authentication
- Always require authentication for environment variable endpoints
- Use API keys or JWT tokens for verification
- Implement rate limiting

### 2. Encryption
- Store sensitive data encrypted at rest
- Use HTTPS for all communications
- Consider encrypting environment variables before storage

### 3. Access Control
- Limit access to specific IP addresses if possible
- Use least privilege principle
- Regularly rotate API keys and secrets

### 4. Monitoring
- Log access to environment variable endpoints
- Set up alerts for unauthorized access attempts
- Monitor for unusual usage patterns

## Recommended Approach

For your ClearSkin AI app, I recommend **Option 1: Cloudflare Workers** because:

1. **Cost-effective**: Free tier includes 100,000 requests/day
2. **Secure**: Built-in encryption and security features
3. **Fast**: Global edge network for low latency
4. **Easy to manage**: Simple CLI and dashboard interface
5. **Scalable**: Automatically scales with your app usage

## Next Steps

1. **Choose your hosting option** (Cloudflare Workers recommended)
2. **Set up the environment variable service**
3. **Update your React Native app** to fetch variables from the service
4. **Test thoroughly** in staging environment
5. **Deploy to production** with monitoring in place

## Support

If you need help with deployment or have questions, contact:
- Email: contact@clearskinai.ca
- Documentation: Check the respective service documentation
- Community: Stack Overflow, Reddit, or service-specific forums
