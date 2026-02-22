import { RaceEvent, EventCategory } from "@/types/event";
import { toDate } from "@/lib/utils";

/**
 * Checks if the early bird promo is currently active for an event.
 */
export function isEarlyBirdActive(event: RaceEvent): boolean {
    if (!event.earlyBird?.enabled || !event.earlyBird.startDate || !event.earlyBird.endDate) {
        return false;
    }

    const now = new Date();
    const startDate = toDate(event.earlyBird.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = toDate(event.earlyBird.endDate);
    endDate.setHours(23, 59, 59, 999);

    return now >= startDate && now <= endDate;
}

/**
 * Gets the effective price for a category based on current date and promo status.
 */
export function getEffectivePrice(event: RaceEvent, category: EventCategory): number {
    if (isEarlyBirdActive(event) && category.earlyBirdPrice != null) {
        const eb = Number(category.earlyBirdPrice);
        const reg = Number(category.price);
        // Ensure EB price is actually lower, otherwise it makes no sense to show it
        if (!isNaN(eb) && eb < reg) {
            return eb;
        }
    }
    return Number(category.price) || 0;
}

/**
 * Returns the number of days remaining for the early bird promo.
 * Returns null if not active or expired.
 */
export function getEarlyBirdDaysRemaining(event: RaceEvent): number | null {
    if (!isEarlyBirdActive(event) || !event.earlyBird?.endDate) {
        return null;
    }

    const now = new Date();
    const endDate = toDate(event.earlyBird.endDate);
    endDate.setHours(23, 59, 59, 999);

    const diffTime = endDate.getTime() - now.getTime();
    if (diffTime < 0) return null;

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Checks if registration is closed based on registrationEndDate.
 */
export function isRegistrationClosed(event: RaceEvent): boolean {
    if (!event.registrationEndDate) return false;

    const now = new Date();
    const endDate = toDate(event.registrationEndDate);
    endDate.setHours(23, 59, 59, 999);

    return now > endDate;
}

/**
 * Checks if the event date is in the past.
 */
export function isEventOver(event: RaceEvent): boolean {
    if (!event.date) return false;

    const now = new Date();
    const eventDate = toDate(event.date);
    // Consider it over at the end of the event day
    eventDate.setHours(23, 59, 59, 999);

    return now > eventDate;
}
