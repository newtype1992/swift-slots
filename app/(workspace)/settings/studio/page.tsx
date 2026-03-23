import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AddressFields } from "@/components/address-fields";
import { EmptyState } from "@/components/swift/empty-state";
import { PageHeader } from "@/components/swift/page-header";
import { getOperatorStudioSnapshot } from "@/lib/studios/server";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";
import { upsertStudioProfileAction } from "../actions";

type StudioSettingsPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function StudioSettingsPage({ searchParams }: StudioSettingsPageProps) {
  const params = (await searchParams) ?? {};
  const { supabase, user, profile } = await requireWorkspaceShellContext();
  const { studio, slots } =
    profile?.role === "studio_operator"
      ? await getOperatorStudioSnapshot({
          supabase,
          userId: user.id,
        })
      : { studio: null, slots: [] };

  if (profile?.role !== "studio_operator") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Studio profile"
          title="Studio tools are operator-only"
          description="Switch this account to studio operator mode before creating a studio profile."
          actions={
            <Button asChild>
              <Link href="/settings/profile">Update account role</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studio profile"
        title={studio ? "Manage studio identity" : "Create your studio profile"}
        description="Studio identity, address, and categories live here. Slot publishing now has its own dedicated route."
        meta={
          <>
            <Badge variant="outline">{studio ? "Profile ready" : "Needs setup"}</Badge>
            <Badge variant="outline">{slots.length} recent slots</Badge>
          </>
        }
        actions={
          studio ? (
            <Button asChild>
              <Link href="/slots">Open slot management</Link>
            </Button>
          ) : undefined
        }
      />

      {params.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Error: {params.error}
        </div>
      ) : null}
      {params.message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {params.message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Studio details</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Configure the studio identity first. This profile powers discovery and studio context across the operator flow.
            </p>
          </CardHeader>
          <CardContent>
            <form action={upsertStudioProfileAction} className="grid gap-4">
              <input type="hidden" name="redirectTo" value="/settings/studio" />
              <input type="hidden" name="studioId" value={studio?.id ?? ""} />

              <div className="grid gap-2">
                <label htmlFor="studio-name" className="text-sm font-medium text-foreground">
                  Studio name
                </label>
                <Input id="studio-name" name="name" type="text" defaultValue={studio?.name ?? ""} required />
              </div>

              <div className="grid gap-2">
                <label htmlFor="studio-slug" className="text-sm font-medium text-foreground">
                  Studio slug
                </label>
                <Input
                  id="studio-slug"
                  name="slug"
                  type="text"
                  defaultValue={studio?.slug ?? ""}
                  placeholder="auto-generated-if-empty"
                />
              </div>

              <AddressFields
                section="studio"
                addressLine1Name="locationText"
                addressLine1Id="studio-location"
                addressLine1Label="Street address"
                addressLine1Value={studio?.location_text}
                cityName="city"
                cityId="studio-city"
                cityValue={studio?.city ?? "Montreal"}
                provinceName="province"
                provinceId="studio-province"
                provinceValue={studio?.province ?? "QC"}
                postalCodeName="postalCode"
                postalCodeId="studio-postal-code"
                postalCodeValue={studio?.postal_code}
                helperText="Used for discovery ranking and fallback distance calculations."
                addressLine1Required
              />

              <div className="grid gap-2">
                <label htmlFor="studio-categories" className="text-sm font-medium text-foreground">
                  Class categories
                </label>
                <Input
                  id="studio-categories"
                  name="classCategories"
                  type="text"
                  defaultValue={studio?.class_categories?.join(", ") ?? ""}
                  placeholder="Yoga, Pilates, HIIT"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="studio-description" className="text-sm font-medium text-foreground">
                  Description
                </label>
                <Textarea
                  id="studio-description"
                  name="description"
                  rows={4}
                  defaultValue={studio?.description ?? ""}
                  placeholder="A short summary for future marketplace screens."
                />
              </div>

              <Button type="submit" className="w-full md:w-auto">
                {studio ? "Save studio profile" : "Create studio profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {studio ? (
            <Card className="border-border/80 bg-card/95 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle>{studio.name}</CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">{studio.location_text}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{studio.city}</Badge>
                  <Badge variant="outline">{studio.province}</Badge>
                  <Badge variant="outline">{studio.class_categories.length} categories</Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {studio.description || "No public description yet."}
                </p>
                <Button asChild className="w-full">
                  <Link href="/slots">Open slot management</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="No studio profile yet"
              description="Create the studio profile first. Slot management becomes available immediately after that."
            />
          )}

          <Card className="border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle>Route split</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Studio profile handles identity, address, and categories.</p>
              <p>Slot management handles posting, status tabs, and inventory monitoring.</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/slots">Go to slots</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
