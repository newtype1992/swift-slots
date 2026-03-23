"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSlotAction } from "@/app/(workspace)/settings/actions";

type SlotComposerProps = {
  studioId: string;
  redirectTo: string;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

export function SlotComposer({ studioId, redirectTo }: SlotComposerProps) {
  const [originalPrice, setOriginalPrice] = useState("32");
  const [discountPercent, setDiscountPercent] = useState("25");

  const preview = useMemo(() => {
    const original = Number(originalPrice);
    const discount = Number(discountPercent);

    if (!Number.isFinite(original) || !Number.isFinite(discount) || original <= 0 || discount <= 0 || discount >= 100) {
      return null;
    }

    return original * (1 - discount / 100);
  }, [discountPercent, originalPrice]);

  return (
    <form action={createSlotAction} className="grid gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="studioId" value={studioId} />

      <div className="grid gap-2">
        <label htmlFor="slot-class-type" className="text-sm font-medium text-foreground">
          Class type
        </label>
        <Input id="slot-class-type" name="classType" type="text" placeholder="Morning Flow" required />
      </div>

      <div className="grid gap-2">
        <label htmlFor="slot-start-time" className="text-sm font-medium text-foreground">
          Start time
        </label>
        <Input id="slot-start-time" name="startTime" type="datetime-local" required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="slot-length" className="text-sm font-medium text-foreground">
            Class length (minutes)
          </label>
          <Input
            id="slot-length"
            name="classLengthMinutes"
            type="number"
            min="15"
            step="5"
            defaultValue="60"
            required
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="slot-spots" className="text-sm font-medium text-foreground">
            Available spots
          </label>
          <Input id="slot-spots" name="availableSpots" type="number" min="1" step="1" defaultValue="1" required />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="slot-original-price" className="text-sm font-medium text-foreground">
            Original price
          </label>
          <Input
            id="slot-original-price"
            name="originalPrice"
            type="number"
            min="1"
            step="0.01"
            value={originalPrice}
            onChange={(event) => setOriginalPrice(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="slot-discount-percent" className="text-sm font-medium text-foreground">
            Discount percent
          </label>
          <Input
            id="slot-discount-percent"
            name="discountPercent"
            type="number"
            min="1"
            max="99"
            step="1"
            value={discountPercent}
            onChange={(event) => setDiscountPercent(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Derived price preview
        </p>
        <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          {preview !== null ? formatMoney(preview) : "Enter a valid price and discount"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Swift Slots stores original price plus discount percent, then derives the live booking price.
        </p>
      </div>

      <Button type="submit" className="w-full md:w-auto">
        Publish slot
      </Button>
    </form>
  );
}
