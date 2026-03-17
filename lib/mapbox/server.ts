type GeocodeAddressInput = {
  addressLine1: string;
  addressLine2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
};

type GeocodeAddressResult =
  | {
      status: "ok";
      latitude: number;
      longitude: number;
      placeName: string | null;
    }
  | {
      status: "missing_token" | "no_match" | "error";
      placeName: null;
      latitude: null;
      longitude: null;
    };

function mapboxServerToken() {
  return process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
}

export function mapboxIsConfigured() {
  return Boolean(mapboxServerToken());
}

function buildQuery(input: GeocodeAddressInput) {
  return [
    input.addressLine1,
    input.addressLine2 || "",
    input.city || "",
    input.province || "",
    input.postalCode || "",
    input.countryCode || "CA",
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(", ");
}

export async function geocodeAddress(input: GeocodeAddressInput): Promise<GeocodeAddressResult> {
  const accessToken = mapboxServerToken();

  if (!accessToken) {
    return {
      status: "missing_token",
      placeName: null,
      latitude: null,
      longitude: null,
    };
  }

  const query = buildQuery(input);

  if (!query) {
    return {
      status: "no_match",
      placeName: null,
      latitude: null,
      longitude: null,
    };
  }

  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("autocomplete", "false");
  url.searchParams.set("limit", "1");
  url.searchParams.set("country", input.countryCode?.trim().toUpperCase() || "CA");
  url.searchParams.set("language", "en");
  url.searchParams.set("permanent", "true");
  url.searchParams.set("types", "address,street");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        status: "error",
        placeName: null,
        latitude: null,
        longitude: null,
      };
    }

    const payload = (await response.json()) as {
      features?: Array<{
        properties?: {
          full_address?: string | null;
        };
        geometry?: {
          coordinates?: [number, number];
        };
      }>;
    };

    const feature = payload.features?.[0];
    const coordinates = feature?.geometry?.coordinates;

    if (!coordinates || coordinates.length < 2) {
      return {
        status: "no_match",
        placeName: null,
        latitude: null,
        longitude: null,
      };
    }

    return {
      status: "ok",
      placeName: feature?.properties?.full_address || null,
      longitude: coordinates[0],
      latitude: coordinates[1],
    };
  } catch {
    return {
      status: "error",
      placeName: null,
      latitude: null,
      longitude: null,
    };
  }
}

