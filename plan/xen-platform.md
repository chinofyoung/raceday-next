# xenPlatform Integration Plan (Philippines)

To integrate with **xenPlatform** (specifically for Managed accounts in the Philippines), you need to gather specific information based on whether your race organizers are **Individuals** or **Registered Businesses** (Sole Prop, Partnership, or Corp).

Since you are a developer, the most efficient way is to collect this data via your registration form and then pass it to the **Xendit Create Account API**.

---

## 1. Basic Account Fields (Initial Setup)
Every sub-account requires these three fields to be created in the system:
*   **Business Name:** The name shown to runners on the payment page.
*   **Email:** The organizer's email (they will receive an invite to their own Xendit dashboard).
*   **Type:** Set this to `MANAGED` so they can have their own balance and payouts.

---

## 2. KYC (Verification) Details
To enable Payouts, Xendit requires "Know Your Customer" (KYC) data. Here is the breakdown for the Philippine market:

### For Individual Organizers
*Ideal for small, independent race directors.*
*   **Full Legal Name:** Must match their ID.
*   **Date of Birth & Nationality.**
*   **Primary ID:** (Any one: Passport, Driver’s License, PhilID, UMID, SSS, or PRC).
*   **Selfie with ID:** A photo of them holding their primary ID.
*   **Phone Number & Residential Address.**

### For Registered Businesses (Sole Prop / Corp)
*Required for larger events or established sports agencies.*
*   **Business Documents:**
    *   **DTI Registration** (for Sole Proprietors) or **SEC Registration** (for Corporations).
    *   **BIR 2303 (COR):** Their tax registration certificate.
*   **Authorized Representative Details:**
    *   Full name and ID of the person managing the account.
    *   **Proof of Authority:** (e.g., a Secretary's Certificate or Board Resolution).
*   **Online Presence:** A link to the race website or a social media page (Xendit uses this to verify the "nature of business").

---

## 3. Payout (Bank) Details
To initiate payouts, you'll need their destination bank info:
*   **Bank Name:** (e.g., BDO, BPI, GCash, Maya).
*   **Account Holder Name:** Must strictly match the Legal Name or Business Name submitted for KYC.
*   **Account Number.**

---

## 🛑 Important: Industry-Specific Note
Since you are in the Events/Sports industry, Xendit might ask for a **"Proof of Event."** You should prepare your system to store:
*   Race Permit (if applicable).
*   Event Date & Location.

---

## Summary Table for your Frontend Form

| Category | Field Name | Data Type |
| :--- | :--- | :--- |
| **Identity** | `legal_name` | String |
| **Contact** | `email`, `phone` | String / Number |
| **KYC** | `id_type`, `id_number` | Dropdown / String |
| **Files** | `id_photo`, `bir_2303` | File Upload (Cloudinary) |
| **Bank** | `bank_code`, `account_no` | Dropdown / String |

---

## 💡 Implementation Tip for Next.js
Since you are using **Cloudinary**, have the organizers upload their ID photos there first. Then, take the **Secure URL** from Cloudinary and pass it to Xendit’s `kyc_documents` array in your API call. This keeps your Firebase/Convex storage clean.