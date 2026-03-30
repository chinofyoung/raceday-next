"use client";

import { useFormContext } from "react-hook-form";
import { RegistrationFormValues } from "@/lib/validations/registration";
import { RaceEvent } from "@/types/event";
import { PaymentInstructions } from "./PaymentInstructions";

interface Step5PaymentProps {
    event: RaceEvent;
    registrationId: string;
    onComplete: () => void;
}

export function Step5Payment({ event, registrationId, onComplete }: Step5PaymentProps) {
    const { watch } = useFormContext<RegistrationFormValues>();
    const data = watch();

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight text-white">Send <span className="text-primary">payment</span></h2>
                <p className="text-text-muted font-medium">
                    Transfer the total amount to any of the accounts below, then upload your proof of payment.
                </p>
            </div>

            <PaymentInstructions
                organizerId={event.organizerId}
                registrationId={registrationId}
                totalPrice={data.totalPrice}
                showUpload={true}
                onProofUploaded={onComplete}
            />

            <div className="text-center">
                <button
                    type="button"
                    onClick={onComplete}
                    className="text-sm text-text-muted hover:text-white transition-colors underline underline-offset-4"
                >
                    Skip for now — I&apos;ll upload proof later
                </button>
            </div>
        </div>
    );
}
