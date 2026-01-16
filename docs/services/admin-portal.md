---
sidebar_position: 5
---

# Admin Portal

The Admin Portal is a web-based administration interface that provides system administrators with tools to manage the Identivia platform. It offers a centralized dashboard for monitoring, configuration, and user management.

## Overview

| Property | Value |
|----------|-------|
| **Image** | `ghcr.io/identivia/admin-portal:latest` |
| **Container Name** | `admin-portal` |
| **Internal Port** | `80` |
| **External URL** | `https://admin.${DOMAIN}` |

## Features

- **Dashboard**: Real-time overview of system status and key metrics
- **User Management**: Manage admin users and permissions
- **Verification Management**: Review and manage verification requests
- **Configuration**: System-wide settings and configuration
- **Audit Logs**: View system activity and audit trails
- **Analytics**: Verification statistics and reports

## Docker Configuration

```yaml
admin-portal:
  image: ghcr.io/identivia/admin-portal:latest
  container_name: admin-portal
  restart: unless-stopped
  environment:
    - POCKETBASE_URL=${POCKETBASE_PUBLIC_URL}
  depends_on:
    pocketbase:
      condition: service_healthy
  labels:
    - traefik.enable=true
    - traefik.http.routers.admin-portal.rule=Host(`admin.${DOMAIN}`)
    - traefik.http.routers.admin-portal.entrypoints=websecure
    - traefik.http.routers.admin-portal.tls.certresolver=letsencrypt
    - traefik.http.services.admin-portal.loadbalancer.server.port=80
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `POCKETBASE_URL` | Public URL to PocketBase for API calls | Yes |

### Example Configuration

```bash
# Admin Portal
POCKETBASE_PUBLIC_URL=https://pocketbase.identivia.com
```

:::note
The Admin Portal uses the **public** PocketBase URL since it runs in the browser and needs to make API calls from the client side.
:::

## Dependencies

The Admin Portal depends on:

- **PocketBase**: Must be healthy before starting (health check condition)

## Accessing the Admin Portal

1. Navigate to `https://admin.${DOMAIN}`
2. Log in with your admin credentials (created in PocketBase)

### First-Time Setup

1. Ensure PocketBase admin account is created
2. Access the Admin Portal URL
3. Log in with PocketBase admin credentials
4. Configure initial settings

## Dashboard Features

### Overview

The dashboard provides at-a-glance information:

- **Total Verifications**: Count of all verification requests
- **Pending Reviews**: Verifications awaiting manual review
- **Success Rate**: Percentage of successful verifications
- **Active Users**: Currently active end-users

### Verification Management

| Feature | Description |
|---------|-------------|
| **Verification List** | View all verification requests with filtering and search |
| **Detail View** | Examine individual verification details and documents |
| **Manual Review** | Approve or reject pending verifications |
| **Status Updates** | Change verification status and add notes |

### User Management

| Feature | Description |
|---------|-------------|
| **Admin Users** | Create and manage admin accounts |
| **Roles & Permissions** | Define access levels and permissions |
| **Activity Logs** | View admin user activity |

### Settings

| Setting | Description |
|---------|-------------|
| **General Settings** | Platform name, logo, and branding |
| **Verification Settings** | Thresholds and requirements |
| **Notification Settings** | Email templates and triggers |
| **Integration Settings** | External service configurations |

## Security

### Authentication

The Admin Portal uses PocketBase for authentication:

- Session-based authentication
- Secure cookie storage
- Automatic session expiration

### Authorization

Access is controlled through PocketBase's role system:

- **Super Admin**: Full access to all features
- **Admin**: Standard administrative access
- **Reviewer**: Limited to verification review only

### Best Practices

1. **Use strong passwords**: Enforce minimum password requirements
2. **Enable 2FA**: Use PocketBase's OAuth providers for additional security
3. **Regular audits**: Review admin activity logs regularly
4. **Limit access**: Only grant necessary permissions

:::warning
Always use HTTPS in production. The Admin Portal is configured to use Traefik's Let's Encrypt certificates automatically.
:::

## Browser Compatibility

The Admin Portal is tested and supported on:

| Browser | Version |
|---------|---------|
| Chrome | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | Latest 2 versions |
| Edge | Latest 2 versions |

:::note
JavaScript must be enabled for the Admin Portal to function.
:::

## Troubleshooting

### Cannot Log In

1. Verify PocketBase is running and accessible
2. Check the `POCKETBASE_PUBLIC_URL` is correct
3. Ensure your admin account exists in PocketBase
4. Clear browser cache and cookies
5. Check browser console for errors

### Dashboard Not Loading

1. Verify network connectivity to PocketBase
2. Check for CORS issues in browser console
3. Ensure PocketBase URL uses HTTPS
4. Verify the container is running: `docker ps`

### Data Not Syncing

1. Check real-time subscription status in browser console
2. Verify WebSocket connections are allowed
3. Check PocketBase logs for errors
4. Restart the container if necessary

### Slow Performance

1. Check network latency to PocketBase
2. Monitor browser memory usage
3. Consider pagination for large datasets
4. Review PocketBase query performance

## Customization

### Branding

The Admin Portal supports customization through settings:

- Logo upload
- Color scheme
- Platform name
- Footer text

### Localization

The Admin Portal interface is available in:

- English (default)
- Additional languages can be added via configuration

## Related Documentation

- [PocketBase Admin UI](https://pocketbase.io/docs/admin-ui/)
