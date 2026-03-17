"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { MarketplaceSlot } from "@/lib/marketplace/server";
import { discountedPrice } from "@/lib/marketplace/server";
import { type Coordinates, rankMarketplaceSlots } from "@/lib/location";

type MarketplaceResultsProps = {
  slots: MarketplaceSlot[];
  savedCoordinates: Coordinates | null;
  savedAddressLabel: string | null;
};

type LocationMode = "device" | "profile" | "none";
type StartWindowFilter = "any" | "2h" | "4h" | "today";

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

function filterMarketplaceSlots(
  slots: MarketplaceSlot[],
  filters: {
    classType: string;
    startWindow: StartWindowFilter;
    maxPrice: string;
    minDiscount: string;
  }
) {
  const now = Date.now();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null;
  const minDiscount = Number(filters.minDiscount) || 0;

  return slots.filter((slot) => {
    if (filters.classType !== "all" && slot.class_type !== filters.classType) {
      return false;
    }

    const discountedAmount = discountedPrice(slot.original_price, slot.discount_percent);

    if (maxPrice !== null && discountedAmount > maxPrice) {
      return false;
    }

    if (slot.discount_percent < minDiscount) {
      return false;
    }

    const slotStart = new Date(slot.start_time).getTime();

    if (filters.startWindow === "2h" && slotStart > now + 2 * 60 * 60 * 1000) {
      return false;
    }

    if (filters.startWindow === "4h" && slotStart > now + 4 * 60 * 60 * 1000) {
      return false;
    }

    if (filters.startWindow === "today" && slotStart > endOfToday.getTime()) {
      return false;
    }

    return true;
  });
}

export function MarketplaceResults({
  slots,
  savedCoordinates,
  savedAddressLabel,
}: MarketplaceResultsProps) {
  const [activeCoordinates, setActiveCoordinates] = useState<Coordinates | null>(savedCoordinates);
  const [locationMode, setLocationMode] = useState<LocationMode>(savedCoordinates ? "profile" : "none");
  const [locationMessage, setLocationMessage] = useState(
    savedCoordinates
      ? `Using saved address${savedAddressLabel ? ` near ${savedAddressLabel}` : ""} until current location is available.`
      : "Allow location access to sort nearby openings, or add a saved address in your profile."
  );
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [classTypeFilter, setClassTypeFilter] = useState("all");
  const [startWindowFilter, setStartWindowFilter] = useState<StartWindowFilter>("any");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [minDiscountFilter, setMinDiscountFilter] = useState("0");

  const classTypeOptions = useMemo(
    () => Array.from(new Set(slots.map((slot) => slot.class_type))).sort((a, b) => a.localeCompare(b)),
    [slots]
  );

  const deferredFilters = useDeferredValue({
    classType: classTypeFilter,
    startWindow: startWindowFilter,
    maxPrice: maxPriceFilter,
    minDiscount: minDiscountFilter,
  });

  const filteredRankedSlots = useMemo(() => {
    const filtered = filterMarketplaceSlots(slots, deferredFilters);
    return rankMarketplaceSlots(filtered, activeCoordinates);
  }, [activeCoordinates, deferredFilters, slots]);

  const activeFilterCount = useMemo(() => {
    return [
      classTypeFilter !== "all",
      startWindowFilter !== "any",
      maxPriceFilter !== "",
      minDiscountFilter !== "0",
    ].filter(Boolean).length;
  }, [classTypeFilter, maxPriceFilter, minDiscountFilter, startWindowFilter]);

  function applyCurrentLocation(coords: Coordinates) {
    setActiveCoordinates(coords);
    setLocationMode("device");
    setLocationMessage("Using your current device location for nearby ranking.");
  }

  function requestCurrentLocation() {
    if (!navigator.geolocation) {
      setActiveCoordinates(savedCoordinates);
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
        setActiveCoordinates(savedCoordinates);
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

  function resetFilters() {
    setClassTypeFilter("all");
    setStartWindowFilter("any");
    setMaxPriceFilter("");
    setMinDiscountFilter("0");
  }

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

      <section className="panel">
        <div className="sectionHeader">
          <div className="stack compactStack">
            <p className="eyebrow">Filters</p>
            <h2>Refine what shows up</h2>
            <p className="muted">
              Narrow by class type, how soon the class starts, minimum discount, and the maximum discounted price you are willing to pay.
            </p>
          </div>
          <div className="sectionHeaderActions">
            <span className="tag">
              {filteredRankedSlots.length} of {slots.length} visible
            </span>
            {activeFilterCount > 0 ? (
              <button type="button" className="buttonSecondary" onClick={resetFilters}>
                Clear {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
              </button>
            ) : null}
          </div>
        </div>
        <div className="grid two topSpacing">
          <div className="field">
            <label htmlFor="marketplace-class-type">Class type</label>
            <select
              id="marketplace-class-type"
              value={classTypeFilter}
              onChange={(event) => setClassTypeFilter(event.target.value)}
            >
              <option value="all">All class types</option>
              {classTypeOptions.map((classType) => (
                <option key={classType} value={classType}>
                  {classType}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="marketplace-start-window">Starts within</label>
            <select
              id="marketplace-start-window"
              value={startWindowFilter}
              onChange={(event) => setStartWindowFilter(event.target.value as StartWindowFilter)}
            >
              <option value="any">Any time</option>
              <option value="2h">Next 2 hours</option>
              <option value="4h">Next 4 hours</option>
              <option value="today">Today</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="marketplace-max-price">Max discounted price</label>
            <select id="marketplace-max-price" value={maxPriceFilter} onChange={(event) => setMaxPriceFilter(event.target.value)}>
              <option value="">Any price</option>
              <option value="15">$15 or less</option>
              <option value="25">$25 or less</option>
              <option value="35">$35 or less</option>
              <option value="50">$50 or less</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="marketplace-min-discount">Minimum discount</label>
            <select
              id="marketplace-min-discount"
              value={minDiscountFilter}
              onChange={(event) => setMinDiscountFilter(event.target.value)}
            >
              <option value="0">Any discount</option>
              <option value="10">10% or more</option>
              <option value="20">20% or more</option>
              <option value="30">30% or more</option>
              <option value="40">40% or more</option>
              <option value="50">50% or more</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid two">
        {filteredRankedSlots.length > 0 ? (
          filteredRankedSlots.map(({ slot, distanceKm }) => (
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
            <h2>{slots.length > 0 ? "No slots match these filters" : "No bookable slots right now"}</h2>
            <p className="muted">
              {slots.length > 0
                ? "Try widening the filters or clearing them to see more bookable classes."
                : "The marketplace is empty at the moment. Open slots will appear here once studios publish them far enough ahead of class start."}
            </p>
            {slots.length > 0 && activeFilterCount > 0 ? (
              <div className="actions topSpacing">
                <button type="button" className="buttonSecondary" onClick={resetFilters}>
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
