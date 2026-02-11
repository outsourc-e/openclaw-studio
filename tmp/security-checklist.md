# Next.js SaaS Security Deployment Checklist

> Comprehensive security checklist for production deployment. Review each section before going live.

---

## 1. Authentication & Authorization

### Session Management
- [ ] Use secure, httpOnly cookies for session tokens
- [ ] Set `SameSite=Strict` or `SameSite=Lax` on auth cookies
- [ ] Implement proper session expiration (idle + absolute timeouts)
- [ ] Rotate session tokens after login/privilege changes
- [ ] Invalidate sessions server-side on logout
- [ ] Store sessions in a secure backend (Redis, database) not just JWTs

### Password Security
- [ ] Enforce minimum password length (12+ characters recommended)
- [ ] Use strong hashing (bcrypt, scrypt, or Argon2 with proper cost factors)
- [ ] Implement account lockout after failed attempts (5-10 attempts)
- [ ] Add breach detection (HaveIBeenPwned API integration)
- [ ] Never log or expose passwords in error messages

### Multi-Factor Authentication
- [ ] Offer TOTP-based 2FA (Google Authenticator, Authy)
- [ ] Consider WebAuthn/passkeys for passwordless auth
- [ ] Require MFA for admin accounts
- [ ] Implement backup codes with single-use enforcement
- [ ] Rate limit MFA verification attempts

### OAuth/Social Login
- [ ] Validate `state` parameter to prevent CSRF
- [ ] Verify `id_token` signatures and claims
- [ ] Check `aud` (audience) claim matches your client ID
- [ ] Handle account linking securely (email verification)
- [ ] Store tokens encrypted at rest

### Authorization
- [ ] Implement RBAC or ABAC consistently
- [ ] Check permissions server-side on every request
- [ ] Use middleware for route protection (`middleware.ts`)
- [ ] Validate user owns resources before access (IDOR prevention)
- [ ] Audit sensitive permission changes

---

## 2. Security Headers

### next.config.js Headers Configuration
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Header Checklist
- [ ] **HSTS**: `Strict-Transport-Security` with long max-age (2 years)
- [ ] **X-Frame-Options**: `DENY` or `SAMEORIGIN` (prevent clickjacking)
- [ ] **X-Content-Type-Options**: `nosniff` (prevent MIME sniffing)
- [ ] **Referrer-Policy**: `strict-origin-when-cross-origin` minimum
- [ ] **Permissions-Policy**: Disable unused browser features
- [ ] **CSP**: Start strict, loosen as needed (audit mode first)
- [ ] Remove `X-Powered-By` header (Next.js does this by default)
- [ ] Test headers with [securityheaders.com](https://securityheaders.com)

### Content Security Policy (CSP)
- [ ] Define `default-src 'self'` as baseline
- [ ] Whitelist specific domains for scripts, styles, images
- [ ] Use nonces or hashes instead of `'unsafe-inline'` where possible
- [ ] Enable CSP reporting to catch violations
- [ ] Test thoroughly—CSP breaks things silently

---

## 3. CORS Configuration

### API Route CORS Setup
```typescript
// middleware.ts or API routes
const allowedOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com',
];

// For API routes
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  
  const headers = new Headers();
  
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  
  // Your logic here
}
```

### CORS Checklist
- [ ] **Never use `*` for authenticated endpoints**
- [ ] Whitelist specific origins explicitly
- [ ] Set `Access-Control-Allow-Credentials: true` only when needed
- [ ] Limit allowed methods to what's actually used
- [ ] Limit allowed headers to what's necessary
- [ ] Handle OPTIONS preflight requests properly
- [ ] Validate `Origin` header server-side
- [ ] Consider using a CORS library (e.g., `cors` package) for consistency
- [ ] Test CORS with different origins (curl, browser devtools)

---

## 4. Rate Limiting

### Implementation Options

#### Option A: Vercel Edge (if on Vercel)
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
  analytics: true,
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    });
  }
}
```

#### Option B: Self-hosted with Redis
```typescript
// lib/rate-limit.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number }> {
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  
  return {
    success: current <= limit,
    remaining: Math.max(0, limit - current),
  };
}
```

### Rate Limiting Checklist
- [ ] Rate limit by IP for anonymous endpoints
- [ ] Rate limit by user ID for authenticated endpoints
- [ ] Apply stricter limits to auth endpoints (login, signup, password reset)
- [ ] Implement exponential backoff for repeated violations
- [ ] Return proper `429` status with `Retry-After` header
- [ ] Include rate limit headers (`X-RateLimit-*`) in responses
- [ ] Consider different tiers for different endpoints
- [ ] Use distributed rate limiting (Redis) for multi-instance deployments
- [ ] Monitor and alert on rate limit breaches
- [ ] Document rate limits in API documentation

### Recommended Limits
| Endpoint Type | Limit |
|--------------|-------|
| Login/Signup | 5 req/min per IP |
| Password Reset | 3 req/hour per email |
| API (authenticated) | 100 req/min per user |
| API (anonymous) | 20 req/min per IP |
| File Upload | 10 req/hour per user |
| Webhook | 1000 req/min per integration |

---

## 5. Secrets Management

### Environment Variables
```bash
# .env.local (NEVER commit this)
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="<random-32-bytes>"
STRIPE_SECRET_KEY="sk_live_..."
AWS_SECRET_ACCESS_KEY="..."

# .env.example (commit this as template)
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
STRIPE_SECRET_KEY="sk_test_..."
```

### Secrets Checklist
- [ ] **Never commit secrets to git** (use `.gitignore`)
- [ ] Use `.env.local` for local development
- [ ] Use platform secrets (Vercel, AWS Secrets Manager, etc.) for production
- [ ] Prefix client-safe vars with `NEXT_PUBLIC_` only when intended
- [ ] Audit all `NEXT_PUBLIC_*` vars—they're exposed to browsers
- [ ] Generate strong secrets: `openssl rand -base64 32`
- [ ] Rotate secrets periodically (quarterly minimum)
- [ ] Use different secrets per environment (dev/staging/prod)
- [ ] Implement secret scanning in CI (GitGuardian, GitHub secret scanning)
- [ ] Document which secrets are needed in README

### Server-Side Only Access
```typescript
// lib/config.ts - server only
export const config = {
  database: {
    url: process.env.DATABASE_URL!,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
  },
  // Validate at startup
  validate() {
    const required = ['DATABASE_URL', 'STRIPE_SECRET_KEY', 'NEXTAUTH_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }
  }
};

// Call in server startup
config.validate();
```

### Secret Rotation Procedure
1. Generate new secret
2. Add new secret alongside old (support both temporarily)
3. Deploy with dual-secret support
4. Update all dependent services
5. Remove old secret
6. Verify functionality
7. Document rotation date

---

## 6. Additional Security Measures

### Input Validation
- [ ] Validate all inputs server-side (never trust client)
- [ ] Use Zod or similar for schema validation
- [ ] Sanitize user content before rendering (XSS prevention)
- [ ] Use parameterized queries / ORM (SQL injection prevention)
- [ ] Validate file uploads (type, size, content)

### API Security
- [ ] Use HTTPS everywhere (redirect HTTP)
- [ ] Implement request signing for sensitive APIs
- [ ] Version your API (`/api/v1/`)
- [ ] Return consistent error formats (don't leak stack traces)
- [ ] Log security-relevant events (auth failures, permission denials)

### Database Security
- [ ] Use least-privilege database users
- [ ] Enable TLS for database connections
- [ ] Encrypt sensitive data at rest (PII, payment info)
- [ ] Regular backups with tested restoration
- [ ] Audit database access patterns

### Dependency Security
- [ ] Run `npm audit` / `pnpm audit` regularly
- [ ] Enable Dependabot or Renovate
- [ ] Pin dependency versions in production
- [ ] Review dependency changes before merging
- [ ] Remove unused dependencies

### Monitoring & Incident Response
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor for unusual traffic patterns
- [ ] Create runbook for security incidents
- [ ] Document escalation procedures
- [ ] Regular security reviews/penetration testing

---

## Pre-Launch Security Checklist

### Final Verification
- [ ] All checklist items above reviewed
- [ ] Security headers verified with securityheaders.com
- [ ] HTTPS working with valid certificate
- [ ] No secrets in git history (use BFG Repo-Cleaner if needed)
- [ ] Error pages don't leak sensitive info
- [ ] Admin routes protected and rate-limited
- [ ] Logging configured (without sensitive data)
- [ ] Backup and recovery tested
- [ ] Incident response plan documented

### Ongoing Maintenance
- [ ] Schedule quarterly security reviews
- [ ] Subscribe to Next.js security advisories
- [ ] Monitor CVE databases for dependencies
- [ ] Keep Node.js and dependencies updated
- [ ] Review access logs periodically

---

## Resources

- [Next.js Security Documentation](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [Vercel Security](https://vercel.com/docs/security)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

*Last updated: 2026-02-11*
