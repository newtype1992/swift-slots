"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MarketplaceFilterBar,
  type MarketplaceFilters,
  type StartWindowFilter,
} from "@/components/marketplace/marketplace-filter-bar";
import {
  LocationStatusCard,
  type LocationMode,
} from "@/components/marketplace/location-status-card";
import { SlotCard } from "@/components/marketplace/slot-card";
import { EmptyState } from "@/components/swift/empty-state";
import type { MarketplaceSlot } from "@/lib/marketplace/server";
import { discountedPrice } from "@/lib/marketplace/server";
import { type Coordinates, rankMarketplaceSlots } from "@/lib/location";

type MarketplaceResultsProps = {
  slots: MarketplaceSlot[];
  savedCoordinates: Coordinates | null;
  savedAddressLabel: string | null;
};

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

function filterMarketplaceSlots(
  slots: MarketplaceSlot[],
  filters: MarketplaceFilters
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
    <div className="space-y-6">
      <LocationStatusCard
        locationMode={locationMode}
        locationMessage={locationMessage}
        isRequestingLocation={isRequestingLocation}
        showSavedAddressAction={locationMode !== "profile"}
        onRequestCurrentLocation={requestCurrentLocation}
      />

      <MarketplaceFilterBar
        classTypeOptions={classTypeOptions}
        filters={{
          classType: classTypeFilter,
          startWindow: startWindowFilter,
          maxPrice: maxPriceFilter,
          minDiscount: minDiscountFilter,
        }}
        activeFilterCount={activeFilterCount}
        visibleCount={filteredRankedSlots.length}
        totalCount={slots.length}
        onClassTypeChange={setClassTypeFilter}
        onStartWindowChange={setStartWindowFilter}
        onMaxPriceChange={setMaxPriceFilter}
        onMinDiscountChange={setMinDiscountFilter}
        onReset={resetFilters}
      />

      {filteredRankedSlots.length > 0 ? (
        <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
          {filteredRankedSlots.map(({ slot, distanceKm }) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              distanceLabel={distanceKm !== null ? formatDistance(distanceKm) : "Montreal"}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={slots.length > 0 ? "No slots match these filters" : "No bookable slots right now"}
          description={
            slots.length > 0
              ? "Try widening the filters or clearing them to see more bookable classes."
              : "The marketplace is empty right now. Open slots will appear here once studios publish them far enough ahead of class start."
          }
          action={
            slots.length > 0 && activeFilterCount > 0 ? (
              <Button type="button" variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
