"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export type LocationMode = "device" | "profile" | "none";

type LocationStatusCardProps = {
  locationMode: LocationMode;
  locationMessage: string;
  isRequestingLocation: boolean;
  showSavedAddressAction: boolean;
  onRequestCurrentLocation: () => void;
};

export function LocationStatusCard({
  locationMode,
  locationMessage,
  isRequestingLocation,
  showSavedAddressAction,
  onRequestCurrentLocation,
}: LocationStatusCardProps) {
  return (
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
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onRequestCurrentLocation}
              disabled={isRequestingLocation}
            >
              {isRequestingLocation ? "Locating..." : "Use current location"}
            </Button>
            {showSavedAddressAction ? (
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/settings/profile">Update saved address</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
