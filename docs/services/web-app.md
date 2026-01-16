---
sidebar_position: 6
---

# Web App

The Web App is the main user-facing application that provides the identity verification experience. It guides users through the verification process including document capture, face liveness checks, and result handling.

## Overview

| Property | Value |
|----------|-------|
| **Image** | `ghcr.io/identivia/web-app:latest` |
| **Container Name** | `web-app` |
| **Internal Port** | `80` |
| **External URL** | `https://app.${DOMAIN}` |

## Features

- **Document Capture**: Camera-based document scanning and upload
- **Face Liveness**: Real-time face detection with liveness verification
- **Device Fingerprinting**: Fingerprint.js integration for fraud prevention
- **Responsive Design**: Mobile-first design for all devices
- **Progress Tracking**: Clear step-by-step verification flow
- **Multi-language Support**: Internationalization support

## Docker Configuration

```yaml
web-app:
  image: ghcr.io/identivia/web-app:latest
  container_name: web-app
  restart: unless-stopped
  environment:
    - VITE_FINGERPRINT_PUBLIC_KEY=${VITE_FINGERPRINT_PUBLIC_KEY}
    - VITE_BACKEND_API_URL=${VITE_BACKEND_API_URL}
    - VITE_DEMO_SITE_URL=${VITE_DEMO_SITE_URL}
    - VITE_DOMAIN_URL=${VITE_DOMAIN_URL}
  depends_on:
    pocketbase:
      condition: service_healthy
    backend-api:
      condition: service_started
  labels:
    - traefik.enable=true
    - traefik.http.routers.web-app.rule=Host(`app.${DOMAIN}`)
    - traefik.http.routers.web-app.entrypoints=websecure
    - traefik.http.routers.web-app.tls.certresolver=letsencrypt
    - traefik.http.services.web-app.loadbalancer.server.port=80
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FINGERPRINT_PUBLIC_KEY` | Public key for Fingerprint.js client SDK | Yes |
| `VITE_BACKEND_API_URL` | URL to the Backend API service | Yes |
| `VITE_DEMO_SITE_URL` | URL to demo/sandbox site (optional redirect) | No |
| `VITE_DOMAIN_URL` | Base domain for cookie and security settings | Yes |

### Example Configuration

```bash
# Web App
VITE_FINGERPRINT_PUBLIC_KEY=your_fingerprint_public_key
VITE_BACKEND_API_URL=https://api.identivia.com
VITE_DEMO_SITE_URL=https://demo.identivia.com
VITE_DOMAIN_URL=identivia.com
```

:::note
Variables prefixed with `VITE_` are embedded at build time and exposed to the browser. Never put sensitive secrets in these variables.
:::

## Dependencies

The Web App depends on:

- **PocketBase**: Must be healthy (for user session management)
- **Backend API**: Must be started (for verification processing)

## Verification Flow

The Web App guides users through a multi-step verification process:

```
┌─────────────────┐
│   1. Welcome    │
│   (Get Started) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Document    │
│    Capture      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Face        │
│   Liveness      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Processing  │
│   & Verification│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. Results     │
│   (Success/Fail)│
└─────────────────┘
```

### Step 1: Welcome

- Introduction to the verification process
- Privacy policy acknowledgment
- Get started button

### Step 2: Document Capture

- Camera permission request
- Document type selection (ID, Passport, Driver's License)
- Front and back capture for applicable documents
- Image quality validation
- Manual upload fallback

### Step 3: Face Liveness

- Camera permission (if not already granted)
- Face detection guidance
- Liveness challenge (head movement, blink detection)
- Real-time feedback
- Selfie capture

### Step 4: Processing

- Document analysis
- Face comparison
- Liveness verification
- Fraud detection
- Processing indicator

### Step 5: Results

- Verification outcome (approved/rejected/manual review)
- Next steps guidance
- Retry option if failed

## Device Requirements

### Supported Devices

| Device Type | Requirements |
|-------------|--------------|
| Desktop | Modern browser with webcam |
| Mobile | iOS 14+ or Android 10+ |
| Tablet | Same as mobile requirements |

### Browser Requirements

| Feature | Requirement |
|---------|-------------|
| JavaScript | Enabled |
| Cookies | Enabled (for sessions) |
| Camera | Permission required |
| WebRTC | Supported browser |

### Minimum Browser Versions

| Browser | Version |
|---------|---------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 14+ |
| Edge | 80+ |

## Fingerprint.js Integration

The Web App uses Fingerprint.js for device fingerprinting:

### Purpose

- **Fraud Prevention**: Detect suspicious devices and patterns
- **Session Binding**: Ensure verification integrity
- **Analytics**: Track device usage patterns

### Configuration

1. Obtain a Fingerprint.js subscription
2. Get your public API key from the dashboard
3. Set `VITE_FINGERPRINT_PUBLIC_KEY` environment variable

:::note
Fingerprint.js public keys are safe to expose in the browser. Secret keys should only be used server-side in the Backend API.
:::

## Accessibility

The Web App follows WCAG 2.1 AA guidelines:

- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus indicators
- Alt text for images
- Form field labels

## Internationalization

The Web App supports multiple languages:

| Language | Code |
|----------|------|
| English | `en` |
| Spanish | `es` |
| French | `fr` |
| German | `de` |

Language is automatically detected from the browser or can be manually selected.

## Security

### Client-Side Security

- **No secrets in browser**: All sensitive operations happen server-side
- **HTTPS only**: Enforced via Traefik
- **CSP headers**: Content Security Policy for XSS prevention
- **Secure cookies**: HttpOnly, Secure, SameSite flags

### Camera Security

- Camera access requires explicit user permission
- Video streams are processed locally when possible
- Images are transmitted securely to the backend
- No persistent camera recording

### Data Handling

- Temporary storage only during verification
- Automatic cleanup after verification completion
- GDPR-compliant data handling

## Error Handling

The Web App provides user-friendly error handling:

| Error Type | User Message | Action |
|------------|--------------|--------|
| Camera denied | "Camera access required" | Guide to enable camera |
| Network error | "Connection lost" | Retry button |
| API error | "Something went wrong" | Contact support option |
| Browser unsupported | "Browser not supported" | Suggested browsers |

## Troubleshooting

### Camera Not Working

1. Check browser camera permissions
2. Ensure no other app is using the camera
3. Try a different browser
4. Check device camera functionality

### Verification Failing

1. Ensure good lighting for document capture
2. Hold document steady during capture
3. Face the camera directly for liveness check
4. Check internet connection stability

### Page Not Loading

1. Clear browser cache and cookies
2. Disable browser extensions
3. Check network connectivity
4. Verify the URL is correct

### Mobile Issues

1. Use the native mobile browser (Safari on iOS, Chrome on Android)
2. Ensure app permissions are granted
3. Update to the latest browser version
4. Close other camera-using apps

## Performance

### Optimization Tips

- Images are compressed before upload
- Progressive loading for faster initial display
- Service worker caching (when enabled)
- Lazy loading of non-critical resources

### Recommended Network

| Connection | Experience |
|------------|------------|
| 4G/LTE | Excellent |
| 3G | Acceptable |
| WiFi | Excellent |
| 2G | Not recommended |

## Related Documentation

- [Backend API](/docs/services/backend-api) - API service documentation
- [Fingerprint.js Documentation](https://dev.fingerprint.com/docs)
