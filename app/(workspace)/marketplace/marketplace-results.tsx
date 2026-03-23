"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SlotCard } from "@/components/marketplace/slot-card";
import { EmptyState } from "@/components/swift/empty-state";
import { NativeSelect } from "@/components/swift/native-select";
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
    <div className="space-y-6">
      <Card className="border-border/80 bg-card/95 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Discovery mode
              </p>
              <CardTitle>
                {locationMode === "device"
                  ? "Current location active"
                  : locationMode === "profile"
                    ? "Saved address fallback"
                    : "Location not set"}
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">{locationMessage}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={requestCurrentLocation} disabled={isRequestingLocation}>
                {isRequestingLocation ? "Locating..." : "Use current location"}
              </Button>
              {locationMode !== "profile" ? (
                <Button asChild variant="outline">
                  <Link href="/settings/profile">Update saved address</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/80 bg-card/95 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Filters
              </p>
              <CardTitle>Deals happening now</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Refine by class type, timing, price, and discount while keeping the booking flow dense and readable.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {filteredRankedSlots.length} of {slots.length} visible
              </Badge>
              {activeFilterCount > 0 ? (
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Clear {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={classTypeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setClassTypeFilter("all")}
            >
              All classes
            </Button>
            {classTypeOptions.map((classType) => (
              <Button
                key={classType}
                type="button"
                variant={classTypeFilter === classType ? "default" : "outline"}
                size="sm"
                onClick={() => setClassTypeFilter(classType)}
              >
                {classType}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <label htmlFor="marketplace-start-window" className="text-sm font-medium text-foreground">
                Starts within
              </label>
              <NativeSelect
                id="marketplace-start-window"
                value={startWindowFilter}
                onChange={(event) => setStartWindowFilter(event.target.value as StartWindowFilter)}
              >
                <option value="any">Any time</option>
                <option value="2h">Next 2 hours</option>
                <option value="4h">Next 4 hours</option>
                <option value="today">Today</option>
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <label htmlFor="marketplace-max-price" className="text-sm font-medium text-foreground">
                Max discounted price
              </label>
              <NativeSelect
                id="marketplace-max-price"
                value={maxPriceFilter}
                onChange={(event) => setMaxPriceFilter(event.target.value)}
              >
                <option value="">Any price</option>
                <option value="15">$15 or less</option>
                <option value="25">$25 or less</option>
                <option value="35">$35 or less</option>
                <option value="50">$50 or less</option>
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <label htmlFor="marketplace-min-discount" className="text-sm font-medium text-foreground">
                Minimum discount
              </label>
              <NativeSelect
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
              </NativeSelect>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredRankedSlots.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
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
