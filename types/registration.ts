type UniversalDate = number | Date | any;


export type RegistrationStatus = "pending" | "paid" | "cancelled" | "failed";
export type PaymentStatus = "unpaid" | "paid" | "failed" | "expired";

export interface ParticipantInfo {
    name: string;
    email: string;
    phone: string;
    tShirtSize: string;
    singletSize: string;
    emergencyContact: {
        name: string;
        phone: string;
        relationship: string;
    };
    medicalConditions?: string;
}

export interface Registration {
    id: string;
    userId: string;
    eventId: string;
    categoryId: string;
    participantInfo: ParticipantInfo;

    // Who is performing the registration
    registeredByUserId: string;
    registeredByName: string;
    isProxy: boolean;

    // Pricing
    basePrice: number;
    vanityPremium: number;
    totalPrice: number;

    // Status
    status: RegistrationStatus;
    paymentStatus: PaymentStatus;

    // Race Data
    vanityNumber?: string;
    raceNumber?: string;
    qrCodeUrl?: string;
    raceKitClaimed: boolean;
    raceKitClaimedAt?: UniversalDate | Date;

    // Payments
    xenditPaymentId?: string;
    paidAt?: UniversalDate | Date;

    // Metadata
    createdAt: UniversalDate | Date;
    updatedAt: UniversalDate | Date;
}
