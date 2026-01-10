---
sidebar_position: 1
title: Introduction
id: intro
---

# Introduction to KYCsecure

Welcome to the **KYCsecure** documentation!

**KYCsecure** is a developer-friendly tool designed to simplify **Know Your Customer (KYC)** identity verification. It provides a seamless bridge between your application and our robust verification backend.

## Why KYCsecure?

Integrating compliance workflows often requires building complex infrastructure for document handling, security, and manual review processes. KYCsecure solves this by offering:

- **Instant Onboarding**: Trigger KYC verification flows with a simple API call.
- **Hosted Verification UI**: Redirect users to a secure, pre-built experience for document upload and liveness checks.
- **Unified Status Tracking**: Poll a single endpoint to track verification progress from "started" to "approved" or "rejected".
- **Secure Storage**: All sensitive identity artifacts are securely stored and audit-ready in our backend (PocketBase).

## Key Features

- **Simple Integration**: Uses standard REST APIs and API keys for authentication.
- **Separation of Concerns**: Your app handles the user journey; we handle the compliance complexity.
- **Developer First**: Built with clear documentation, predictable error handling, and local development support.

## Getting Started

Ready to integrate?

1. **[Concept Overview](./concept.md)**: Understand the architecture and data flows.
2. **[Getting Started](./getting-started.md)**: Follow our quickstart guide to create your first profile and trigger a verification flow.
3. **[API Reference](/api)**: Explore the detailed API endpoints and data models.
