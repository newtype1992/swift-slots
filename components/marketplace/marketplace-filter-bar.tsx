"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/swift/native-select";

export type StartWindowFilter = "any" | "2h" | "4h" | "today";

export type MarketplaceFilters = {
  classType: string;
  startWindow: StartWindowFilter;
  maxPrice: string;
  minDiscount: string;
};

type MarketplaceFilterBarProps = {
  classTypeOptions: string[];
  filters: MarketplaceFilters;
  activeFilterCount: number;
  visibleCount: number;
  totalCount: number;
  onClassTypeChange: (value: string) => void;
  onStartWindowChange: (value: StartWindowFilter) => void;
  onMaxPriceChange: (value: string) => void;
  onMinDiscountChange: (value: string) => void;
  onReset: () => void;
};

export function MarketplaceFilterBar({
  classTypeOptions,
  filters,
  activeFilterCount,
  visibleCount,
  totalCount,
  onClassTypeChange,
  onStartWindowChange,
  onMaxPriceChange,
  onMinDiscountChange,
  onReset,
}: MarketplaceFilterBarProps) {
  return (
    <Card className="border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Filters</p>
            <CardTitle>Deals happening now</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Refine by class type, timing, price, and discount while keeping the booking flow dense and readable.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {visibleCount} of {totalCount} visible
            </Badge>
            {activeFilterCount > 0 ? (
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onReset}>
                Clear {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Button
            type="button"
            variant={filters.classType === "all" ? "default" : "outline"}
            size="sm"
            className="shrink-0"
            onClick={() => onClassTypeChange("all")}
          >
            All classes
          </Button>
          {classTypeOptions.map((classType) => (
            <Button
              key={classType}
              type="button"
              variant={filters.classType === classType ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={() => onClassTypeChange(classType)}
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
              value={filters.startWindow}
              onChange={(event) => onStartWindowChange(event.target.value as StartWindowFilter)}
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
              value={filters.maxPrice}
              onChange={(event) => onMaxPriceChange(event.target.value)}
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
              value={filters.minDiscount}
              onChange={(event) => onMinDiscountChange(event.target.value)}
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
  );
}
