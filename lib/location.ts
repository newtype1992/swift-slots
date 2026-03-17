import type { MarketplaceSlot } from "@/lib/marketplace/server";
import type { Profile } from "@/lib/workspace/server";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineDistanceKm(a: Coordinates, b: Coordinates) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

export function formatAddress(parts: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
}) {
  return [parts.addressLine1, parts.addressLine2, parts.city, parts.province, parts.postalCode]
    .map((value) => value?.trim() || "")
    .filter(Boolean)
    .join(", ");
}

export function getProfileCoordinates(profile: Pick<Profile, "latitude" | "longitude"> | null | undefined) {
  if (
    !profile ||
    typeof profile.latitude !== "number" ||
    Number.isNaN(profile.latitude) ||
    typeof profile.longitude !== "number" ||
    Number.isNaN(profile.longitude)
  ) {
    return null;
  }

  return {
    latitude: profile.latitude,
    longitude: profile.longitude,
  } satisfies Coordinates;
}

export function rankMarketplaceSlots(slots: MarketplaceSlot[], origin: Coordinates | null) {
  return [...slots]
    .map((slot) => {
      const distanceKm =
        origin && typeof slot.studio?.latitude === "number" && typeof slot.studio?.longitude === "number"
          ? haversineDistanceKm(origin, {
              latitude: slot.studio.latitude,
              longitude: slot.studio.longitude,
            })
          : null;

      return {
        slot,
        distanceKm,
      };
    })
    .sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null && a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }

      if (a.distanceKm !== null && b.distanceKm === null) {
        return -1;
      }

      if (a.distanceKm === null && b.distanceKm !== null) {
        return 1;
      }

      return new Date(a.slot.start_time).getTime() - new Date(b.slot.start_time).getTime();
    });
}

