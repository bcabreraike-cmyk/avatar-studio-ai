# AvatarStudio AI - Licensing & Monetization System

## 🎯 Overview

AvatarStudio AI uses a **subscription-based license model** with API key authentication. Users must:

1. **Create an account** and add a payment method (credit/debit card)
2. **Choose a subscription plan**
3. **Receive an API key** to authenticate requests
4. **Usage is tracked and billed** based on selected plan

**Developers** have a special unlimited developer account for testing.

---

## 📋 Subscription Plans

### Developer (Free - for development only)
- ✅ Unlimited API calls
- ✅ Full feature access
- ✅ Local models only
- ✅ No rate limits
- ⚠️ **NOT for production use**
- **Price**: Free
- **Max users**: 1 developer account per repo

### Starter ($9.99/month)
- ✅ 100 avatar generations/month
- ✅ 50 scene generations/month
- ✅ 25 video exports/month
- ✅ 5GB storage
- ✅ Email support
- **Rate limit**: 10 requests/minute
- **Max concurrent**: 1 process

### Pro ($49.99/month)
- ✅ 1000 avatar generations/month
- ✅ 500 scene generations/month
- ✅ 250 video exports/month
- ✅ 100GB storage
- ✅ Priority support
- **Rate limit**: 50 requests/minute
- **Max concurrent**: 3 processes

### Enterprise (Custom pricing)
- ✅ Unlimited everything
- ✅ Dedicated support
- ✅ Custom integrations
- ✅ On-premise deployment
- **Rate limit**: No limits
- **Max concurrent**: Unlimited

---

## 🔐 Authentication System

### 1. API Key-based Authentication

Every request must include an API key in the header:

```bash
curl -X POST http://localhost:3000/api/avatar/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "...", "style": "professional"}'
```

### 2. Developer Mode (Unlimited Access)

For development/testing, use the developer API key:

```bash
# Get developer key
DEVELOPER_API_KEY=dev_$(openssl rand -hex 16)

# Use in requests
curl -X POST http://localhost:3000/api/avatar/generate \
  -H "Authorization: Bearer dev_xxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### 3. License Check

Before processing ANY request, the system checks:

```
┌─────────────────────────────┐
│ Request with API Key        │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Check API Key in Database   │
└────────────┬────────────────┘
             │
         ┌───┴────┐
         │         │
       Valid?    Invalid?
         │         │
         ▼         ▼
      Check    ❌ Return 401
      Plan     Unauthorized
         │
         ▼
    Check Usage
    vs Plan Limits
         │
     ┌───┴───┐
     │       │
  Within?  Over?
     │       │
     ▼       ▼
  Process  ❌ Return 429
  Request  Rate Limited
     │
     ▼
  Log Usage
  in Database
```

---

## 💾 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  subscription_plan VARCHAR(50), -- 'developer', 'starter', 'pro', 'enterprise'
  stripe_customer_id VARCHAR(255),
  api_key VARCHAR(255) UNIQUE,
  api_key_created_at TIMESTAMP,
  account_status VARCHAR(50), -- 'active', 'suspended', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_api_key ON users(api_key);
```

### API Keys Table
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  key VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE UNIQUE INDEX idx_api_keys_key ON api_keys(key);
```

### Usage Tracking Table
```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  api_key_id UUID REFERENCES api_keys(id),
  endpoint VARCHAR(255), -- '/api/avatar/generate', '/api/scene/generate', etc
  task_type VARCHAR(50), -- 'avatar', 'scene', 'video', 'object', 'marketing'
  status VARCHAR(50), -- 'success', 'failed', 'rate_limited'
  timestamp TIMESTAMP DEFAULT NOW(),
  response_time_ms INT,
  tokens_used INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_usage_logs_user_id_timestamp ON usage_logs(user_id, timestamp);
CREATE INDEX idx_usage_logs_endpoint ON usage_logs(endpoint);
```

### Usage Summary (for monthly limits)
```sql
CREATE TABLE monthly_usage (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  month DATE, -- First day of month
  avatar_count INT DEFAULT 0,
  scene_count INT DEFAULT 0,
  video_count INT DEFAULT 0,
  storage_used_gb DECIMAL(10, 2) DEFAULT 0,
  UNIQUE(user_id, month),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_monthly_usage_user_month ON monthly_usage(user_id, month);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  plan VARCHAR(50) NOT NULL, -- 'starter', 'pro', 'enterprise'
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50), -- 'active', 'past_due', 'cancelled'
  current_period_start DATE,
  current_period_end DATE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
```

---

## 🚀 Implementation Steps

### Step 1: Create Authentication Service

```typescript
// packages/backend/src/services/auth.service.ts

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export class AuthService {
  /**
   * Validate API key and return user data
   */
  async validateApiKey(apiKey: string) {
    // Check if it's a developer key
    if (apiKey.startsWith('dev_')) {
      return {
        isDeveloper: true,
        userId: 'DEVELOPER',
        subscription: 'developer',
        isUnlimited: true,
      };
    }

    // Query database for API key
    const user = await db.users.findUnique({
      where: { api_key: apiKey },
      include: { subscription: true },
    });

    if (!user || user.account_status !== 'active') {
      throw new Error('Invalid or expired API key');
    }

    return {
      isDeveloper: false,
      userId: user.id,
      subscription: user.subscription_plan,
      isUnlimited: false,
    };
  }

  /**
   * Generate new API key for user
   */
  generateApiKey(): string {
    return `api_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Generate developer API key (one-time setup)
   */
  generateDeveloperKey(): string {
    return `dev_${crypto.randomBytes(32).toString('hex')}`;
  }
}
```

### Step 2: Create License Service

```typescript
// packages/backend/src/services/license.service.ts

export class LicenseService {
  /**
   * Check if user can make a request based on their plan
   */
  async checkUsageLimit(
    userId: string,
    taskType: 'avatar' | 'scene' | 'video' | 'object' | 'marketing'
  ) {
    const user = await db.users.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    // Developer has unlimited access
    if (user.subscription_plan === 'developer') {
      return { allowed: true };
    }

    // Get current month's usage
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const usage = await db.monthly_usage.findUnique({
      where: { user_id_month: { user_id: userId, month: monthStart } },
    });

    // Get plan limits
    const limits = PLAN_LIMITS[user.subscription_plan];

    // Check limits based on task type
    switch (taskType) {
      case 'avatar':
        if (usage?.avatar_count >= limits.avatars_per_month) {
          return { 
            allowed: false, 
            reason: `Avatar limit reached (${limits.avatars_per_month}/month)` 
          };
        }
        break;
      
      case 'scene':
        if (usage?.scene_count >= limits.scenes_per_month) {
          return { 
            allowed: false, 
            reason: `Scene limit reached (${limits.scenes_per_month}/month)` 
          };
        }
        break;
      
      case 'video':
        if (usage?.video_count >= limits.videos_per_month) {
          return { 
            allowed: false, 
            reason: `Video limit reached (${limits.videos_per_month}/month)` 
          };
        }
        break;

      default:
        break;
    }

    return { allowed: true };
  }

  /**
   * Log usage for tracking
   */
  async logUsage(
    userId: string,
    taskType: string,
    status: 'success' | 'failed' | 'rate_limited',
    responseTime: number
  ) {
    // Log to usage_logs table
    await db.usage_logs.create({
      data: {
        user_id: userId,
        endpoint: `/api/${taskType.split('-')[0]}/${taskType}`,
        task_type: taskType,
        status,
        response_time_ms: responseTime,
        timestamp: new Date(),
      },
    });

    // Update monthly_usage if successful
    if (status === 'success') {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const updateData = {};
      updateData[`${taskType}_count`] = { increment: 1 };

      await db.monthly_usage.upsert({
        where: { user_id_month: { user_id: userId, month: monthStart } },
        update: updateData,
        create: {
          user_id: userId,
          month: monthStart,
          [taskType + '_count']: 1,
        },
      });
    }
  }
}

const PLAN_LIMITS = {
  developer: {
    avatars_per_month: Infinity,
    scenes_per_month: Infinity,
    videos_per_month: Infinity,
    storage_gb: Infinity,
  },
  starter: {
    avatars_per_month: 100,
    scenes_per_month: 50,
    videos_per_month: 25,
    storage_gb: 5,
  },
  pro: {
    avatars_per_month: 1000,
    scenes_per_month: 500,
    videos_per_month: 250,
    storage_gb: 100,
  },
  enterprise: {
    avatars_per_month: Infinity,
    scenes_per_month: Infinity,
    videos_per_month: Infinity,
    storage_gb: Infinity,
  },
};
```

### Step 3: Create Middleware

```typescript
// packages/backend/src/middleware/auth.middleware.ts

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid Authorization header',
      message: 'Please provide a valid API key',
    });
  }

  const apiKey = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    const user = await authService.validateApiKey(apiKey);
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: error.message,
    });
  }
}
```

### Step 4: Protect Endpoints

```typescript
// packages/backend/src/routes/avatar.ts

router.post('/generate', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const startTime = Date.now();

  try {
    // Check usage limits
    const limitCheck = await licenseService.checkUsageLimit(
      user.userId,
      'avatar'
    );

    if (!limitCheck.allowed) {
      await licenseService.logUsage(
        user.userId,
        'avatar',
        'rate_limited',
        0
      );

      return res.status(429).json({
        error: 'Limit exceeded',
        message: limitCheck.reason,
      });
    }

    // Process avatar generation
    const result = await avatarEngine.generate(req.body);

    // Log success
    const duration = Date.now() - startTime;
    await licenseService.logUsage(
      user.userId,
      'avatar',
      'success',
      duration
    );

    return res.json(result);
  } catch (error) {
    await licenseService.logUsage(user.userId, 'avatar', 'failed', 0);
    return res.status(500).json({ error: error.message });
  }
});
```

---

## 💳 Stripe Integration

### Setup Payment Processing

```typescript
// packages/backend/src/services/stripe.service.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export class StripeService {
  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    const user = await db.users.findUnique({ where: { id: userId } });

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
    });

    return session;
  }

  /**
   * Handle webhook from Stripe
   */
  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(
          event.data.object as Stripe.Subscription
        );
        break;
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const planMap: any = {
      'price_starter': 'starter',
      'price_pro': 'pro',
      'price_enterprise': 'enterprise',
    };

    const plan = planMap[subscription.items.data[0].price.id];

    await db.users.update({
      where: { id: userId },
      data: {
        subscription_plan: plan,
        stripe_customer_id: session.customer as string,
      },
    });

    await db.subscriptions.create({
      data: {
        user_id: userId,
        plan,
        stripe_subscription_id: subscription.id,
        status: 'active',
        current_period_start: new Date(
          subscription.current_period_start * 1000
        ),
        current_period_end: new Date(subscription.current_period_end * 1000),
      },
    });
  }
}
```

---

## 📊 Monitoring & Analytics

### Usage Dashboard

```typescript
// GET /api/admin/dashboard (developer only)

{
  "totalUsers": 1250,
  "activeSubscriptions": {
    "starter": 800,
    "pro": 350,
    "enterprise": 100
  },
  "usage": {
    "avatars_generated": 45000,
    "scenes_created": 12000,
    "videos_rendered": 3500
  },
  "revenue": {
    "monthly": 15000,
    "yearly": 180000
  },
  "topUsers": [
    {
      "email": "user@example.com",
      "plan": "pro",
      "avatars": 500,
      "joined": "2026-01-01"
    }
  ]
}
```

---

## 🔒 Security Considerations

1. **API Keys**: Never log or expose API keys in response
2. **Rate Limiting**: Implement per-user and global rate limits
3. **HTTPS Only**: All auth endpoints must use HTTPS
4. **Token Expiration**: API keys don't expire, but can be revoked
5. **Database Encryption**: Encrypt sensitive data at rest
6. **Audit Logs**: Log all auth attempts and usage changes

---

## 📞 Support & Billing

### Endpoints

```
POST   /auth/register          - Create account
POST   /auth/login             - Login (get temporary token)
POST   /auth/logout            - Logout
GET    /user/profile           - Get user profile
POST   /user/api-keys          - Create new API key
GET    /user/api-keys          - List API keys
DELETE /user/api-keys/:id      - Revoke API key

POST   /billing/checkout       - Create checkout session
GET    /billing/subscription   - Get subscription status
POST   /billing/cancel         - Cancel subscription
GET    /billing/invoices       - List invoices
POST   /billing/update-card    - Update payment method

GET    /dashboard/usage        - Get usage stats
GET    /dashboard/billing      - Get billing info
```

---

**Made with ❤️ for sustainable, ethical AI development**
