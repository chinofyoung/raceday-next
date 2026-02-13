# Stage 5 — Payments & Race Kit Tools

> **Goal:** Integrate a payment gateway, build race kit management with QR code scanning, and handle payment tracking and revenue reporting.

---

## 5.1 Payment Integration

### Payment Gateway Options

> [!IMPORTANT]
> **Decision needed:** Which payment gateway should we use? Recommended options for the Philippines market:
> 1. **PayMongo** — Philippine-first, supports GCash, GrabPay, cards, bank transfers. Great API & docs.
> 2. **Dragonpay** — Supports 7-Eleven, GCash, bank transfers. Popular in PH.
> 3. **Stripe** — International, supports cards. May need Stripe Atlas for PH.
>
> **Recommendation:** PayMongo is ideal for a PH-focused running events platform (supports GCash + cards + bank transfers).

**** USE Xendit for payment

### Payment Flow

```
1. Runner completes registration (Step 4 of registration flow)
2. Client creates a checkout session via API route
3. API route:
   a. Creates registration doc in Firestore (status: "pending")
   b. Creates payment intent/checkout with payment provider
   c. Returns checkout URL
4. Runner is redirected to payment page
5. On payment success:
   a. Webhook receives confirmation from payment provider
   b. Update registration paymentStatus → "paid"
   c. Generate QR code
   d. Assign race number (finalize)
   e. Send confirmation email (optional, future stage)
6. On payment failure:
   a. Update registration paymentStatus → "failed"
   b. Show retry option
```

### API Routes

| Route                              | Method | Purpose                              |
| ---------------------------------- | ------ | ------------------------------------ |
| `/api/payments/create-checkout`    | POST   | Create checkout session              |
| `/api/payments/webhook`            | POST   | Handle payment provider webhook      |
| `/api/payments/verify/[id]`        | GET    | Verify payment status                |

### Payment Schema

```typescript
interface Payment {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  amount: number;
  currency: string;           // "PHP"
  method?: string;            // "gcash", "card", "bank_transfer"
  providerPaymentId: string;  // ID from payment provider
  status: "pending" | "succeeded" | "failed" | "refunded";
  checkoutUrl?: string;
  metadata: {
    eventName: string;
    categoryName: string;
    isVanity: boolean;
    vanityPremium: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 5.2 QR Code System

### QR Code Generation

- When payment is confirmed, generate a QR code containing:
  ```json
  {
    "registrationId": "abc123",
    "eventId": "event456",
    "runnerId": "user789",
    "raceNumber": "42K-077"
  }
  ```
- Use `qrcode` npm package to generate QR as data URL.
- Store QR code data URL on the registration doc.

### Dependencies

```
npm install qrcode @types/qrcode
```

---

## 5.3 Race Kit Collection (QR Scanner)

### Organizer Tool: `/dashboard/events/[id]/scanner`

- Full-screen camera-based QR code scanner.
- Use `html5-qrcode` or `@yudiel/react-qr-scanner` package.
- Flow:
  1. Organizer opens scanner on their phone/tablet.
  2. Points camera at runner's QR code.
  3. Scans → decodes registration data.
  4. Shows runner info:
     - Name, race number, category
     - T-shirt size, singlet size
     - Race kit claimed status
  5. "Mark as Claimed" button → updates `raceKitClaimed = true` + timestamp.
  6. If already claimed → show warning: "Race kit already collected!"

### Runner's QR View: `/dashboard/events/[id]/qr`

- Displays the runner's QR code for the specific event.
- Shows registration details:
  - Event name, date
  - Category, race number
  - QR code (large, scannable)
- "Download QR" button (saves as PNG).

### Dependencies

```
npm install html5-qrcode
```

---

## 5.4 Revenue Tracking

### Organizer Revenue View: `/dashboard/events/[id]` (Revenue Tab)

- **Revenue summary cards:**
  - Total revenue
  - Revenue by category (bar chart)
  - Vanity number revenue
  - Refunds
- **Transactions list:**
  - Runner name, category, amount, payment method, date, status
  - Filter by category, payment status
  - Export to CSV

---

## 5.5 Payment Success/Failure Pages

### `/events/[id]/register/success`
- Confirmation page with:
  - ✅ "Registration Confirmed!"
  - Event name, date, category
  - Assigned race number
  - QR code (immediately viewable)
  - "View in Dashboard" CTA
  - "Download QR Code" button

### `/events/[id]/register/failed`
- Error page with:
  - ❌ "Payment Failed"
  - Reason (if available)
  - "Try Again" button → re-initiates payment
  - "Contact Support" link

---

## 5.6 Deliverables Checklist

- [x] Payment provider integrated (Xendit) ✅
- [x] Checkout session creation API route ✅
- [x] Webhook handler for payment confirmation ✅
- [x] Payment schema + Firestore storage ✅
- [x] Registration status updates on payment events ✅
- [x] QR code generation on successful payment ✅
- [x] QR code viewer for runners ✅
- [x] QR code scanner for organizers (camera-based) ✅
- [x] Race kit claim flow (scan → verify → mark claimed) ✅
- [x] Revenue tracking dashboard for organizers ✅
- [x] Payment success & failure pages ✅
- [x] CSV export for transactions ✅
