import Link from "next/link";
import { AddressFields } from "@/components/address-fields";
import { createSlotAction, upsertStudioProfileAction } from "../actions";
import { getOperatorStudioSnapshot } from "@/lib/studios/server";
import { requireWorkspaceShellContext } from "@/lib/workspace/server";

type StudioSettingsPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-CA", {
    year: "numeric",
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

function discountedPrice(originalPrice: number, discountPercent: number) {
  return originalPrice * (1 - discountPercent / 100);
}

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
      <div className="grid">
        <section className="panel">
          <p className="eyebrow">Studio</p>
          <h2>Studio tools are operator-only</h2>
          <p className="muted">
            Switch this account to the studio operator role before creating a studio profile or posting open slots.
          </p>
          {params.error ? <p className="message">Error: {params.error}</p> : null}
          {params.message ? <p className="message">{params.message}</p> : null}
          <div className="actions">
            <Link href="/settings/profile" className="button">
              Update account role
            </Link>
            <Link href="/dashboard" className="buttonSecondary">
              Back to dashboard
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid">
      <section className="panel">
        <p className="eyebrow">Studio</p>
        <h2>{studio ? "Manage your studio" : "Create your studio profile"}</h2>
        <p className="muted">
          Set up the studio identity first, then publish discounted last-minute slots directly from this screen.
        </p>
        {params.error ? <p className="message">Error: {params.error}</p> : null}
        {params.message ? <p className="message">{params.message}</p> : null}
      </section>

      <section className="grid two">
        <article className="panel">
          <h3>Studio profile</h3>
          <form action={upsertStudioProfileAction} className="form">
            <input type="hidden" name="redirectTo" value="/settings/studio" />
            <input type="hidden" name="studioId" value={studio?.id ?? ""} />
            <div className="field">
              <label htmlFor="studio-name">Studio name</label>
              <input id="studio-name" name="name" type="text" defaultValue={studio?.name ?? ""} required />
            </div>
            <div className="field">
              <label htmlFor="studio-slug">Studio slug</label>
              <input id="studio-slug" name="slug" type="text" defaultValue={studio?.slug ?? ""} placeholder="auto-generated-if-empty" />
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
            <div className="field">
              <label htmlFor="studio-categories">Class categories</label>
              <input
                id="studio-categories"
                name="classCategories"
                type="text"
                defaultValue={studio?.class_categories?.join(", ") ?? ""}
                placeholder="Yoga, Pilates, HIIT"
              />
            </div>
            <div className="field">
              <label htmlFor="studio-description">Description</label>
              <textarea
                id="studio-description"
                name="description"
                rows={4}
                defaultValue={studio?.description ?? ""}
                placeholder="A short summary for future marketplace screens."
              />
            </div>
            <button type="submit" className="button">
              {studio ? "Save studio profile" : "Create studio profile"}
            </button>
          </form>
        </article>

        <article className="panel">
          <h3>Studio summary</h3>
          {studio ? (
            <div className="list compact">
              <div className="card subtle">
                <span className="helper">Studio</span>
                <strong>{studio.name}</strong>
                <p className="helper">{studio.location_text}</p>
              </div>
              <div className="card subtle">
                <span className="helper">Marketplace footprint</span>
                <div className="meta topSpacing">
                  <span className="tag">{studio.city}</span>
                  <span className="tag">{studio.province}</span>
                  <span className="tag">{slots.length} recent slots</span>
                </div>
              </div>
              <div className="card subtle">
                <span className="helper">Categories</span>
                <div className="meta topSpacing">
                  {(studio.class_categories?.length ? studio.class_categories : ["No categories yet"]).map((category) => (
                    <span key={category} className="tag">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card subtle">
              <p className="muted">
                Once the studio profile exists, this screen becomes the operator control center for posting and reviewing open slots.
              </p>
            </div>
          )}
        </article>
      </section>

      <section className="grid two">
        <article className="panel">
          <h3>Post open slot</h3>
          {studio ? (
            <form action={createSlotAction} className="form">
              <input type="hidden" name="redirectTo" value="/settings/studio" />
              <input type="hidden" name="studioId" value={studio.id} />
              <div className="field">
                <label htmlFor="slot-class-type">Class type</label>
                <input id="slot-class-type" name="classType" type="text" placeholder="Morning Flow" required />
              </div>
              <div className="field">
                <label htmlFor="slot-start-time">Start time</label>
                <input id="slot-start-time" name="startTime" type="datetime-local" required />
              </div>
              <div className="grid two">
                <div className="field">
                  <label htmlFor="slot-length">Class length (minutes)</label>
                  <input id="slot-length" name="classLengthMinutes" type="number" min="15" step="5" defaultValue="60" required />
                </div>
                <div className="field">
                  <label htmlFor="slot-spots">Available spots</label>
                  <input id="slot-spots" name="availableSpots" type="number" min="1" step="1" defaultValue="1" required />
                </div>
              </div>
              <div className="grid two">
                <div className="field">
                  <label htmlFor="slot-original-price">Original price</label>
                  <input id="slot-original-price" name="originalPrice" type="number" min="1" step="0.01" placeholder="32.00" required />
                </div>
                <div className="field">
                  <label htmlFor="slot-discount-percent">Discount percent</label>
                  <input id="slot-discount-percent" name="discountPercent" type="number" min="1" max="99" step="1" placeholder="25" required />
                </div>
              </div>
              <button type="submit" className="button">
                Publish slot
              </button>
            </form>
          ) : (
            <div className="card subtle">
              <p className="muted">Create the studio profile first. Slot posting becomes available immediately after that.</p>
            </div>
          )}
        </article>

        <article className="panel">
          <h3>Recent slots</h3>
          {slots.length > 0 ? (
            <div className="list">
              {slots.map((slot) => (
                <article key={slot.id} className="card subtle">
                  <div className="splitRow">
                    <div className="stack compactStack">
                      <strong>{slot.class_type}</strong>
                      <span className="helper">{formatDateTime(slot.start_time)}</span>
                    </div>
                    <span className={`tag status-${slot.status}`}>{slot.status}</span>
                  </div>
                  <div className="meta topSpacing">
                    <span className="tag">{slot.available_spots} spots</span>
                    <span className="tag">{slot.class_length_minutes} min</span>
                    <span className="tag">{formatMoney(slot.original_price)}</span>
                    <span className="tag">{slot.discount_percent}% off</span>
                    <span className="tag">{formatMoney(discountedPrice(slot.original_price, slot.discount_percent))}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="card subtle">
              <p className="muted">No slots have been posted yet.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
