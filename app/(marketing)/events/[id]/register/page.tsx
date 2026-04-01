import { notFound } from "next/navigation";
import { getEventById } from "@/lib/services/eventService";
import { RegistrationEvent } from "@/types/event";
import { RegisterClient } from "./RegisterClient";

interface RegisterPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RegisterPage(props: RegisterPageProps) {
    const params = await props.params;
    const searchParams = await props.searchParams;

    const event = await getEventById(params.id);

    if (!event) {
        notFound();
    }

    const registrationEvent: RegistrationEvent = {
        id: event.id,
        name: event.name,
        categories: event.categories,
        registrationEndDate: event.registrationEndDate,
        earlyBird: event.earlyBird,
        vanityRaceNumber: event.vanityRaceNumber,
        paymentMode: event.paymentMode,
        organizerId: event.organizerId,
    };

    const categoryParam = searchParams.category;
    const initialCategoryId = typeof categoryParam === "string" ? categoryParam : null;

    return <RegisterClient event={registrationEvent} initialCategoryId={initialCategoryId} />;
}
