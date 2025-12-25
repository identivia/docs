---
sidebar_position: 1
---

# eKYC Express – Concept Overview

## Purpose

eKYC Express provides a lightweight partner integration layer for triggering electronic Know Your Customer verification flows. It acts as the bridge between third-party product surfaces and the internal review stack that runs on PocketBase. The goal is to offer partners a fast way to initiate applicant journeys, monitor verification outcomes, and supply supporting documents without exposing internal tooling.

## Problem Statement

Companies that rely on regulated onboarding need to embed identity verification into their customer journeys. Building a custom KYC pipeline from scratch is expensive and typically requires:

- Secure credential exchange and API key management
- A robust store for identity artifacts and audit trails
- Workflows for manual review teams and status tracking
- Seamless redirect experiences into hosted KYC flows

eKYC Express solves these challenges by standardising the integration touchpoints, providing a hosted applicant flow, and delegating persistence to PocketBase with minimal boilerplate.

## Key Use Cases

- **Partner-triggered onboarding:** A SaaS partner sends applicant metadata to `/api/profiles/create` and receives a redirect URL to the hosted verification UI.
- **Status visibility:** Backend schedulers or dashboards poll `/api/profiles/:id` to display current verification results and the latest status history entry.
- **Compliance operations:** Internal reviewers attach document scans, facial captures, or notes through authenticated PATCH/POST routes, keeping PocketBase records complete.

## Architecture Snapshot

1. **Express API Layer**
   - Handles REST endpoints, validation, and API key enforcement.
   - Calls PocketBase for record creation, updates, and history lookup.
2. **PocketBase Backend**
   - Stores applicant profiles, uploaded documents, and status audit trail.
   - Provides authentication for the service account used by the API layer.
3. **Hosted KYC Frontend**
   - Served separately (configured via `KYC_FRONTEND_URL`).
   - Consumes the record ID appended to the redirect URL to render applicant-specific flows.
4. **Partner Systems**
   - Integrate through authenticated HTTP requests.
   - Use returned identifiers to map KYC progress back to their users.

```
Partner App ──POST /api/profiles/create──▶ Express API ──▶ PocketBase
     │                                              │
     │◀─ Redirect URL (KYC_FRONTEND_URL/id) ────────┘
     │
     ├─ GET /api/profiles/:id ─▶ Express ─▶ PocketBase (status + history)
     └─ Internal tools ─▶ (PATCH/POST) ─▶ Express ─▶ PocketBase (documents, notes)
```

## Data Model (Conceptual)

| Entity           | Description                                                           |
| ---------------- | --------------------------------------------------------------------- |
| `profiles`       | Core applicant record with identifiers, country, and current status.  |
| `status_history` | Append-only log capturing each manual or automated status transition. |

Documents (front/back images, facial photo/video) are stored as file fields associated with `profiles` records in PocketBase.

## Security Model

- **Authentication:** API calls from partners require a shared `x-api-key`, validated against the configured `VALID_API_KEYS`. Internal update routes also rely on server-side PocketBase authentication.
- **Data separation:** Sensitive uploads remain within PocketBase; Express only streams data between the partner and PocketBase.
- **Idempotency:** Profile creation checks for existing document identifiers to prevent duplicate verification attempts and reduce attack surface.
- **Observability:** Logs capture authentication attempts, creation failures, and status update errors for audit readiness.

## Lifecycle and Flows

1. Partner sends applicant metadata.
2. Express authenticates with PocketBase (bootstrapped via service credentials on startup).
3. If a matching record exists, the partner gets the existing ID to resume the flow.
4. New records default to `unverified` status and return a redirect URL.
5. Applicants complete the hosted flow (handled outside this repo) and upload artefacts.
6. Reviewers update the status and documents from internal tools.
7. Partner systems poll for status until the verification reaches a terminal state (`approved`, `rejected`, etc.).

## Success Metrics

- Time-to-integration for partners (target: < 1 day with sample code).
- Reduction in duplicate KYC submissions.
- Faster reviewer throughput due to consistent data capture.
- Uptime and responsiveness of critical endpoints.

## Future Directions

- Event-driven webhooks to replace polling for status changes.
- Granular API keys with scoped permissions per partner.
- Automated document validation and liveness scoring integrations.
- Dashboard for real-time monitoring of verification queues.

---

This concept document should guide onboarding discussions with internal stakeholders, help prioritise roadmap features, and provide context for Docusaurus documentation. For detailed API usage, see `getting-started.md`.\*\*\*
