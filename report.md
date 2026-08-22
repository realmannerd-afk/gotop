# PAYMENT SYSTEM AUDIT

## Overall Status

NOT READY FOR LIVE PAYMENTS

The application currently has critical financial inconsistencies, missing integration pieces (rebids still use mock payments), and webhook vulnerabilities that prevent safe production deployment.

## Dodo Integration

- Uses `@dodopayments/nextjs` for webhook signature verification.
- Dodo Secret Keys are securely loaded server-side and never reach the client bundle.
- Environment switching relies on `process.env.NODE_ENV === 'production'`, which incorrectly forces `live_mode` on Vercel preview environments.
- Default webhook secret `dummy_secret_for_build_time` is used if the env var is missing, causing silent verification failures instead of alerting the developer.

## Initial Payments

- Checkout session correctly calculates dynamic price `bid.amount * 100` and creates a product.
- Safely passes `listing_id` and `bid_id` in Dodo metadata.
- Management tokens are not exposed to Dodo.

## Rebid Payments

- CRITICAL: Rebidding still uses `processRebidMock`. Dodo checkout is completely unintegrated for rebids.
- `processRebidMock` still enforces a minimum bid of $2 (was missed during the $1 update).

## Webhooks

- Only `payment.succeeded` is handled. `payment.failed`, `payment.refunded`, and dispute events are ignored.
- CRITICAL: Webhook fails to link the payment to the bid. It inserts into `payments` table without the `bid_id`.
- CRITICAL: Webhook does not verify `payload.data.total_amount` against `bid.amount`. A manipulated payment amount (if possible) would activate the full bid.
- CRITICAL: Webhook activates the listing only if `status === 'pending'`. If Rebid webhooks were routed here, they would fail to update `current_bid` because Rebid listings are already `active`.

## Idempotency

- Webhook idempotency relies on `eq('status', 'pending')` for the bid. Retried webhooks for the same bid return early. This is conceptually safe for initial bids but breaks for rebids.

## Concurrency

- Existing mock rebid correctly implements Optimistic Concurrency Control (OCC) using `eq('current_bid', listing.current_bid)`.
- However, if the Dodo webhook handled rebids, it currently lacks OCC protection. Simultaneous webhooks could overwrite a higher bid with a lower bid.

## Refunds

- Not implemented. No logic exists to handle Dodo refund webhooks or issue refunds via dashboard.

## Disputes

- Not implemented. No webhook listener for `payment.dispute.created` to suspend listings.

## Currency

- Application uses USD. 
- CRITICAL: Dodo `total_amount` is likely returned in cents. The webhook directly inserts this into the `payments` table without converting back to dollars, causing massive financial discrepancies in the DB (e.g., $51 becomes $5100 in the DB).

## Security

- Webhook signature is validated properly.
- Success URL redirect (`/checkout/[listingId]?status=success`) does NOT blindly activate listings. It correctly relies on the backend polling the database for webhook completion.
- RLS policies default to deny-all for sensitive tables, which is excellent.

## RLS

- Extremely secure. `bids`, `payments`, and `listing_access` have NO public policies. They are entirely locked down to the backend Service Role Key.

## Database

- Missing indexes on `listing_id` inside `impressions`, `clicks`, and `bids` tables, which could slow down aggregations as the database grows.

## Moderation

- Missing. Users can submit arbitrary URLs. There is no admin dashboard or flag to suspend inappropriate or illegal links.

## Rate Limiting

- Missing. No rate limiting on URL submission, mock rebidding, or analytics endpoints. Anonymous endpoints are vulnerable to abuse.

## Legal / Policy

- `/rules` and `/about` exist.
- Missing `/terms`, `/privacy`, and a dedicated `/refund-policy` that explicitly explains the non-refundable nature of outbidding.

## UX

- Checkout flow is smooth, but the UI does not explicitly warn the user during checkout that they will not receive a refund if they are immediately outbid.

## Build

- Compiles properly. 

## Test Matrix

| Test | Expected | Actual | PASS/FAIL |
|---|---|---|---|
| New listing $2 | Payment $2 | Payment $2 | PASS |
| New listing $100 | Payment $100 | Payment $100 | PASS |
| Rebid $100 ? $101 | Payment $1 | Uses Mock Payment | FAIL |
| Rebid $100 ? $151 | Payment $51 | Uses Mock Payment | FAIL |
| Payment success | Activates listing | Activates listing | PASS |
| Payment failure | Leaves pending | Handled safely | PASS |
| Payment cancellation | Leaves pending | Handled safely | PASS |
| Payment expiration | Cleans up DB | Abandoned forever | FAIL |
| Duplicate webhook | Ignores | Ignores via status check | PASS |
| Invalid webhook | Rejects | Rejects via SDK | PASS |
| Fake success URL | Does not activate | Does not activate | PASS |
| Modified amount | Webhook rejects | Webhook accepts blindly | FAIL |
| Modified listing ID | Webhook rejects | Dodo Hosted Page protects | PASS |
| Concurrent rebid | Highest survives | Webhook lacks OCC | FAIL |
| Duplicate checkout | Creates new session | Replaces old pending | PASS |
| Management token security | Kept secret | Not sent to Dodo | PASS |
| Outbid behavior | Downgrades rank | Realtime calculation | PASS |
| Refund behavior | Process refund | Ignored by webhook | FAIL |
| Dispute behavior | Suspend listing | Ignored by webhook | FAIL |

## Issues

| Severity | Issue | File/Area | Impact | Recommendation |
|---|---|---|---|---|
| CRITICAL | Rebid uses Mock Payment | `src/app/manage/actions.ts` | Users bypass real payments for rebids | Implement Dodo checkout for rebids |
| CRITICAL | Webhook amount in Cents | `api/webhook/dodo/route.ts` | Financial metrics corrupted in DB | Divide `total_amount` by 100 before DB insert |
| CRITICAL | Webhook blind to amount | `api/webhook/dodo/route.ts` | Allows activation of underpaid bids | Verify `total_amount / 100 === bid.amount` |
| CRITICAL | Webhook lacks Rebid logic | `api/webhook/dodo/route.ts` | Rebids won't activate if integrated | Remove `status === 'pending'` listing check for rebids |
| HIGH | Webhook lacks OCC | `api/webhook/dodo/route.ts` | Concurrent webhooks overwrite higher bids | Add `eq('current_bid', previous_bid)` to webhook |
| HIGH | Vercel Live Mode Bug | `src/app/actions.ts` | Prevents test payments in preview | Use a dedicated `NEXT_PUBLIC_DODO_ENV` variable |
| HIGH | Missing Refund/Dispute webhooks | `api/webhook/dodo/route.ts` | Disputed listings remain active | Listen for dispute/refund events and suspend listings |
| MEDIUM | No Rate Limiting | `src/app/actions.ts` | Abuse of DB and Dodo API | Implement Vercel KV rate limiting |
| MEDIUM | Missing Legal Policies | `/terms`, `/privacy` | Payment provider compliance risk | Create dedicated Terms & Refund pages |

## FINAL VERDICT

NOT READY FOR LIVE PAYMENTS
