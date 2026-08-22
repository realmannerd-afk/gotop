# DODO FORENSIC AUDIT

## Initial Payment
FAIL

**Trace:**
1. `submitListing` creates listing (`status: 'pending'`) and bid (`status: 'pending'`, `amount: $5`).
2. `createDodoCheckout` connects to Dodo SDK.
3. It creates a dynamic product price by converting to cents: `price: bid.amount * 100` (500 cents).
4. Customer pays on Dodo hosted page.
5. `api/webhook/dodo/route.ts` receives `payment.succeeded`.
6. Webhook extracts `listing_id` and `bid_id` from metadata.
7. Webhook activates listing by querying `.eq('status', 'pending')`.
8. Webhook activates bid by setting `status: 'paid'`.
9. Webhook inserts into `payments` table with `amount: payload.data.total_amount` (500).
10. **Issue:** The payment record is created in cents (500) instead of dollars (5). The `payments` table has no `bid_id` relation saved.

## Rebid Payment
FAIL

**Trace:**
1. Founder visits `/manage/[listingId]/[token]` and clicks Rebid.
2. The UI triggers `processRebidMock(listingId, token, rebidAmount)`.
3. The server validates the OCC condition `eq('current_bid', listing.current_bid)`.
4. The server instantly updates the listing to the new bid and saves a `paid` mock payment.
5. **Issue:** The Dodo SDK is **never called**. Rebid payments are completely unintegrated and bypass Dodo entirely.

## Amount Handling
FAIL

**Trace:**
- UI Amount: $5 (Dollars)
- Server Amount: `data.bid` = 5 (Dollars)
- Dodo Checkout Session API: `bid.amount * 100` = 500 (Cents)
- Dodo Webhook payload: `payload.data.total_amount` = 500 (Cents)
- Database Payment Record: `amount = 500`
**Issue:** The system expects dollars in the DB but saves cents directly from the webhook. A $5 payment is stored as $500 paid.

## Webhook
FAIL

**Verification:**
- Signature: Passed (`@dodopayments/nextjs` validates via HMAC secret).
- Event: Only checks `payment.succeeded`.
- Payment Status: Blindly trusts the payload event.
- Amount: **FAILS.** Webhook does not check if `(total_amount / 100) === bid.amount`.
- Currency: **FAILS.** Webhook does not verify `currency === 'USD'`.
- Listing/Bid relation: **FAILS.** Webhook forgets to insert `bid_id` into the `payments` table.

## Payment ? Bid
FAIL

The webhook correctly updates the specific bid via `eq('id', bid_id)`, but when it creates the `payments` receipt log, it literally omits the `bid_id` field. The payment record floats in the database completely detached from the bid it paid for.

## Idempotency
FAIL

If Dodo sends the exact same webhook twice for an **Initial Payment**, it safely ignores the second one because it looks for a bid with `.eq('status', 'pending')`. 
However, if Rebid webhooks were routed here in the future, they would completely fail because Rebid listings are already `active`.

## Concurrency
FAIL

**Scenario:** Two webhooks arrive exactly at the same time for the same listing.
Because the webhook's SQL `update()` command does not include Optimistic Concurrency Control (OCC) like `.eq('current_bid', previous_bid)`, a delayed $50 webhook could overwrite a newer $100 webhook, permanently dropping the product's rank.

## Security
FAIL

- Dodo API Secret: Server only (Pass).
- Webhook Secret: Server only (Pass).
- Management Token: Not sent to Dodo (Pass).
- Listing Activation: Client cannot forge without webhook signature (Pass).
- Payment Amount: **FAILS.** Since the webhook doesn't verify the amount paid matches the database expectation, if an attacker could trick the checkout session (or if Dodo had a coupon applied), the webhook would blindly activate the full bid for a fraction of the cost.

## Failure Handling
FAIL

Failed payments, cancelled checkouts, and refunds are completely ignored by the webhook. There is no logic to handle `payment.failed` or `payment.dispute.created`. Disputed/refunded listings will remain permanently active on the leaderboard.

## REAL MONEY READINESS
NOT READY

### High Severity Issues

**1. Rebid Checkout Bypass**
- **File:** `src/app/manage/actions.ts`
- **Problem:** Rebidding still uses `processRebidMock`.
- **Attack Scenario:** Founders can indefinitely claim the #1 spot by typing $100,000 without actually paying a single cent.
- **Fix:** Connect the Rebid dashboard flow directly to `createDodoCheckout`.

**2. Database Cents Corruption**
- **File:** `src/app/api/webhook/dodo/route.ts`
- **Problem:** `amount: payload.data.total_amount` inserts cents into a dollar column.
- **Attack Scenario:** Analytics and financial reports will show 100x higher revenue than reality.
- **Fix:** `amount: payload.data.total_amount / 100`.

**3. Missing Webhook Amount Verification**
- **File:** `src/app/api/webhook/dodo/route.ts`
- **Problem:** Webhook blindly activates the bid regardless of how much was actually paid.
- **Attack Scenario:** If a checkout bug or external coupon alters the payment price, a user could pay $1 to activate a $1,000 bid.
- **Fix:** Add `if ((payload.data.total_amount / 100) !== bid.amount) return;`.

**4. Webhook Rebid Activation Block**
- **File:** `src/app/api/webhook/dodo/route.ts`
- **Problem:** `.eq('status', 'pending')` on the `listings` table prevents Rebid webhooks from updating the rank.
- **Failure Scenario:** When rebids are hooked up to Dodo, the webhook will silently fail to update the leaderboard because rebids are already `active`.
- **Fix:** Remove the `.eq('status', 'pending')` constraint when updating listings.

**5. Missing Webhook OCC**
- **File:** `src/app/api/webhook/dodo/route.ts`
- **Problem:** Concurrent webhooks can overwrite higher bids.
- **Failure Scenario:** If User A pays $100 and User B pays $50 at the same time, the DB might save $50 as the current bid depending on race conditions.
- **Fix:** Append `.eq('current_bid', previous_bid)` to the webhook's `update` query.
