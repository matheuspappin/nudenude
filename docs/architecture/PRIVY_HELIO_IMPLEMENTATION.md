# Integration Blueprint: Web3 Payments & Auth (Privy + Helio Pay)

## 1. Overview
This document outlines the architecture to transition the platform from traditional high-risk credit card processors to a frictionless Web3 payment infrastructure using **Privy** (for authentication and embedded Solana wallets) and **Helio Pay** (for crypto and fiat-to-crypto checkout).

**Key Benefits:**
- $0 onboarding fees.
- Zero chargebacks.
- Instant on-chain settlement in USDC/SOL.
- 15% Platform Take-Rate routed directly to Treasury.
- 85% Payout routed instantly to the Creator's wallet.

## 2. Technology Stack
- **Frontend Framework:** Next.js (App Router)
- **Database / Backend:** Supabase (PostgreSQL)
- **Authentication:** Privy (`@privy-io/react-auth`, `@privy-io/server-auth`)
- **Embedded Wallets:** Privy Solana Embedded Wallets
- **Payments / Checkout:** Helio Pay (`@heliofi/checkout-react` or Embedded Helio Paywall API)
- **Network:** Solana (Mainnet-Beta)

## 3. Architecture & Data Flow

### A. Authentication & Wallet Creation (Privy)
1. **User Sign-up:** User logs in via Web2 methods (Google, Apple, Email) using the `PrivyProvider`.
2. **Wallet Provisioning:** Privy automatically provisions a non-custodial Solana Embedded Wallet for the user.
3. **Database Sync:** A webhook or server-side sync mechanism updates the `supabase.profiles` table to store the `privy_user_id` and the `solana_wallet_address`.

### B. Checkout & Paywall (Helio Pay)
1. **Content Access:** User attempts to unlock premium content or subscribe to a creator.
2. **Checkout Trigger:** The frontend renders a Helio Pay checkout widget (`HelioCheckout`).
3. **Payment Modes:** 
   - Crypto Native (USDC/SOL).
   - Fiat On-Ramp (Apple Pay, Credit Card -> auto-swapped to USDC via On-Ramp partners).
4. **Split Payment:** The Helio payment request is configured with a 15% platform fee (sent to `PLATFORM_TREASURY_ADDRESS`) and 85% to the creator.

### C. Webhooks & Fulfillment
1. **Helio Webhook:** On successful payment, Helio sends a `PAYMENT_SUCCESS` webhook to our Next.js API route (`/api/webhooks/helio`).
2. **Verification:** The API verifies the HMAC signature using `HELIO_WEBHOOK_SECRET`.
3. **Database Update:** The API inserts a record into `purchases` or `subscriptions` in Supabase, granting access.
4. **Failure Handling:** On `PAYMENT_FAILED` or chargeback (from fiat on-ramp before finality), access is revoked.

## 4. Environment Variables (`.env.example`)

```env
# Privy
NEXT_PUBLIC_PRIVY_APP_ID="your_privy_app_id"
PRIVY_APP_SECRET="your_privy_app_secret"

# Helio Pay
NEXT_PUBLIC_HELIO_PUBLIC_KEY="your_helio_public_key"
HELIO_API_KEY="your_helio_secret_api_key"
HELIO_WEBHOOK_SECRET="your_helio_webhook_secret"

# Treasury
NEXT_PUBLIC_PLATFORM_TREASURY_ADDRESS="your_solana_treasury_wallet_address"
```

## 5. Repository Structure
Adjustments made due to the absence of a `src/` directory in the current setup.
- `components/checkout/HelioPaywall.tsx` - Wrapper for the Helio checkout widget.
- `utils/privy/index.ts` - Privy server helpers and utilities.
- `app/api/webhooks/helio/route.ts` - Webhook handler.
- `supabase/migrations/` - DB schema updates for wallet addresses.
