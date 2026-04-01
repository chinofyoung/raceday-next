import { notFound } from "next/navigation";
import { getEventById } from "@/lib/services/eventService";
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

    const categoryParam = searchParams.category;
    const initialCategoryId = typeof categoryParam === "string" ? categoryParam : null;

    return <RegisterClient event={event} initialCategoryId={initialCategoryId} />;
}
