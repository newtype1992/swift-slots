"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MarketplaceSlot } from "@/lib/marketplace/server";
import { discountedPrice } from "@/lib/marketplace/server";
import { type Coordinates, rankMarketplaceSlots } from "@/lib/location";

type MarketplaceResultsProps = {
  slots: MarketplaceSlot[];
  savedCoordinates: Coordinates | null;
  savedAddressLabel: string | null;
};

type LocationMode = "device" | "profile" | "none";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

export function MarketplaceResults({
  slots,
  savedCoordinates,
  savedAddressLabel,
}: MarketplaceResultsProps) {
  const initialRanked = useMemo(() => rankMarketplaceSlots(slots, savedCoordinates), [slots, savedCoordinates]);
  const [rankedSlots, setRankedSlots] = useState(initialRanked);
  const [locationMode, setLocationMode] = useState<LocationMode>(savedCoordinates ? "profile" : "none");
  const [locationMessage, setLocationMessage] = useState(
    savedCoordinates
      ? `Using saved address${savedAddressLabel ? ` near ${savedAddressLabel}` : ""} until current location is available.`
      : "Allow location access to sort nearby openings, or add a saved address in your profile."
  );
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  useEffect(() => {
    setRankedSlots(initialRanked);
  }, [initialRanked]);

  function applyCurrentLocation(coords: Coordinates) {
    setRankedSlots(rankMarketplaceSlots(slots, coords));
    setLocationMode("device");
    setLocationMessage("Using your current device location for nearby ranking.");
  }

  function requestCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMode(savedCoordinates ? "profile" : "none");
      setLocationMessage(
        savedCoordinates
          ? `This browser does not expose geolocation. Using saved address${savedAddressLabel ? ` near ${savedAddressLabel}` : ""}.`
          : "This browser does not expose geolocation. Add a saved address in your profile to unlock location fallback."
      );
      return;
    }

    setIsRequestingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsRequestingLocation(false);
        applyCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setIsRequestingLocation(false);
        setLocationMode(savedCoordinates ? "profile" : "none");
        setLocationMessage(
          savedCoordinates
            ? `Location permission was denied. Using saved address${savedAddressLabel ? ` near ${savedAddressLabel}` : ""} instead.`
            : "Location permission was denied and no saved address is available yet. Add one in your profile."
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5 * 60 * 1000,
        timeout: 8 * 1000,
      }
    );
  }

  useEffect(() => {
    requestCurrentLocation();
    // Run once when the page hydrates to satisfy the device-first requirement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid">
      <section className="panel">
        <div className="sectionHeader">
          <div className="stack compactStack">
            <p className="eyebrow">Discovery mode</p>
            <h2>{locationMode === "device" ? "Current location active" : locationMode === "profile" ? "Saved address fallback" : "Location not set"}</h2>
            <p className="muted">{locationMessage}</p>
          </div>
          <div className="sectionHeaderActions">
            <button type="button" className="buttonSecondary" onClick={requestCurrentLocation} disabled={isRequestingLocation}>
              {isRequestingLocation ? "Locating..." : "Use current location"}
            </button>
            {locationMode !== "profile" ? (
              <Link href="/settings/profile" className="buttonSecondary">
                Update saved address
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid two">
        {rankedSlots.length > 0 ? (
          rankedSlots.map(({ slot, distanceKm }) => (
            <article key={slot.id} className="panel">
              <div className="splitRow">
                <div className="stack compactStack">
                  <p className="eyebrow">Open slot</p>
                  <h2>{slot.class_type}</h2>
                  <p className="muted">
                    {slot.studio?.name ?? "Unknown studio"} - {slot.studio?.location_text ?? "Montreal"}
                  </p>
                </div>
                <div className="meta">
                  <span className="tag">{slot.available_spots} spots left</span>
                  {distanceKm !== null ? <span className="tag">{formatDistance(distanceKm)}</span> : null}
                </div>
              </div>
              <div className="meta topSpacing">
                <span className="tag">{formatDateTime(slot.start_time)}</span>
                <span className="tag">{slot.class_length_minutes} min</span>
                <span className="tag">{slot.discount_percent}% off</span>
                <span className="tag">{formatMoney(discountedPrice(slot.original_price, slot.discount_percent))}</span>
              </div>
              <div className="actions topSpacing">
                <Link href={`/marketplace/${slot.id}`} className="button">
                  View slot
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="panel">
            <h2>No bookable slots right now</h2>
            <p className="muted">
              The marketplace is empty at the moment. Open slots will appear here once studios publish them far enough ahead of class start.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

