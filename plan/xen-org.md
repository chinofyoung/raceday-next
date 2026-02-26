In the xenPlatform workflow, the organizer's account is usually created immediately after they sign up or "onboard" as an organizer on your platform.

Since you are using Firebase, this usually happens in a Cloud Function triggered right after the organizer's profile is created in your database.

🚀 The Step-by-Step Workflow
The moment the "account" is technically created depends on how you want to handle the user experience:

Platform Onboarding (The Trigger):
The organizer fills out your "Become an Organizer" form. When they click "Submit," your Firebase app saves their data to Firestore.

Account Creation (The API Call):
A Firebase Cloud Function (triggered by the Firestore write) sends a POST request to Xendit's /v2/accounts endpoint.

Status at this point: INVITED.

What happens: Xendit creates a unique Sub-account ID (e.g., acc-12345) and sends an automated invitation email to the organizer.

Activation (The Organizer's Part):
The organizer opens the email from Xendit, sets their password, and logs into their "Managed" dashboard to submit their IDs and bank details (the KYC process we discussed).

Verification (The Final Gate):
Xendit reviews the documents. Once approved, the account status changes to LIVE.

💻 Why staying with Firebase is a good move here
Since you are sticking with Firebase, you can use Firebase Authentication and Firestore to manage the account lifecycle perfectly:

Firestore Mapping: Store the xendit_sub_account_id directly in the organizer's Firestore document.

TypeScript
// Example Firestore Structure
organizers/{userId}: {
  businessName: "Mountain Trail Runners",
  xenditAccountId: "acc_abc123...", 
  status: "INVITED" // Sync this via Xendit webhooks
}
Webhooks: Use a Firebase HTTPS Trigger to receive webhooks from Xendit. When Xendit approves their KYC, they hit your webhook, and you automatically update their Firestore status to "Live," enabling their "Payout" button in your UI.