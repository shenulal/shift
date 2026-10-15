/**
 * Payments.
 *
 * Core's `purchase` and `enrol` actions create the Purchase record (amount, currency, label) from master data, so prices can
 * never be set by the browser. A PaymentProvider turns that record into money:
 *
 *   ManualProvider (the default, live today)
 *     Bank transfer / payment link sent by the coach. The purchase stays exactly as core created it; the coach confirms the
 *     transfer and flips `status` in the admin (PATCH /api/c/purchases/:id { status: 'paid' }).
 *
 *   Card gateway (TODO — Stripe, Telr or Network International N-Genius)
 *     1. Implement `PaymentProvider` in src/payments/<gateway>.ts:
 *          createCheckout → create a hosted checkout/order for purchase.amount/currency, metadata { purchaseId },
 *                           success/cancel URLs under PUBLIC_URL; return { redirectUrl }.
 *          handleWebhook  → verify the signature with the gateway secret (raw body!), look up purchaseId, mark the purchase
 *                           'paid' (or 'refunded'), then grant access (toolkitIds / journeyAccess / enrolment) and queue the
 *                           payment-confirmation email — i.e. move the "paid" side effects out of core's action.
 *     2. Routes: POST /api/payments/checkout { purchaseId } → createCheckout (owner or admin only);
 *                POST /api/payments/webhook/<gateway> with a raw-body content-type parser, no auth, signature-checked.
 *     3. Env: PAYMENT_PROVIDER=stripe|telr|ngenius plus the gateway's secret + webhook secret.
 *
 *   IMPORTANT: today core marks card purchases `paid` immediately and grants access inside the action. Before taking real card
 *   payments, core should create card purchases as `pending` (no access granted) and expose a `fulfilPurchase(store, id)`
 *   function the webhook calls. Until then, disable the card option in Settings → paymentOptions in production.
 */
import type { Rec, Purchase, Store } from '@shift/core';

export interface CheckoutResult {
  /** Where to send the buyer (hosted payment page). null = nothing to redirect to (manual payment). */
  redirectUrl: string | null;
  /** Human instructions to show (bank details, "we'll send a payment link"). */
  instructions?: string;
}

export interface WebhookResult {
  purchaseId: string | null;
  status: Purchase['status'] | 'ignored';
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(purchase: Rec<Purchase>, opts: { successUrl: string; cancelUrl: string }): Promise<CheckoutResult>;
  /** Verify and apply a gateway callback. Must reject unsigned/forged requests. */
  handleWebhook(req: { headers: Record<string, string | string[] | undefined>; rawBody: Buffer }, store: Store): Promise<WebhookResult>;
}

/** Bank transfer / manual payment link. The purchase record created by core is left untouched. */
export class ManualProvider implements PaymentProvider {
  readonly name = 'manual';
  async createCheckout(purchase: Rec<Purchase>): Promise<CheckoutResult> {
    return { redirectUrl: null, instructions: `We'll email payment details for ${purchase.label} to ${purchase.email}.` };
  }
  async handleWebhook(): Promise<WebhookResult> {
    return { purchaseId: null, status: 'ignored' };
  }
}

export function createPaymentProvider(name = process.env.PAYMENT_PROVIDER ?? 'manual'): PaymentProvider {
  if (name === 'manual') return new ManualProvider();
  throw new Error(`PAYMENT_PROVIDER "${name}" is not implemented — see src/payments.ts`);
}
