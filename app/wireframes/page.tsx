import styles from "./wireframes.module.css";

function Annotation({
  goal,
  primary,
  secondary,
  state,
}: {
  goal: string;
  primary: string;
  secondary: string;
  state: string;
}) {
  return (
    <div className={styles.annotation}>
      <strong>Primary goal: {goal}</strong>
      <span>Primary CTA: {primary}</span>
      <span>Secondary CTA: {secondary}</span>
      <span>Empty / failure state: {state}</span>
    </div>
  );
}

export default function WireframesPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.heroEyebrow}>Wireframe board</span>
        <h1>Swift Slots information architecture and screen wireframes.</h1>
        <p>
          This is a Figma-style board for sign-off before implementation. It separates consumer and operator flows,
          keeps navigation shallow, and moves legacy starter surfaces out of the main product path.
        </p>
        <div className={styles.heroMeta}>
          <span className={styles.pill}>Mobile-first</span>
          <span className={styles.pill}>Role-based IA</span>
          <span className={styles.pill}>Low-fidelity frames</span>
        </div>
      </section>

      <section className={styles.board}>
        <div className={styles.boardHeader}>
          <h2>Information Architecture</h2>
          <p>Primary routes should be shallow. No dropdowns for main navigation. Use dedicated pages for core tasks.</p>
        </div>
        <div className={styles.flowGrid}>
          <div className={styles.flowCard}>
            <h3>Consumer home</h3>
            <p>Signed-in consumer lands on Marketplace, not dashboard.</p>
            <div className={styles.flowTagRow}>
              <span className={styles.tag}>Explore</span>
              <span className={styles.tag}>Bookings</span>
              <span className={styles.tag}>Profile</span>
            </div>
          </div>
          <div className={styles.flowCard}>
            <h3>Operator home</h3>
            <p>Signed-in operator lands on Dashboard with quick links to Slots and Studio.</p>
            <div className={styles.flowTagRow}>
              <span className={styles.tag}>Dashboard</span>
              <span className={styles.tag}>Slots</span>
              <span className={styles.tag}>Studio</span>
            </div>
          </div>
          <div className={styles.flowCard}>
            <h3>Task separation</h3>
            <p>Slot management moves out of settings into its own first-class area.</p>
            <div className={styles.flowTagRow}>
              <span className={styles.tag}>New slot</span>
              <span className={styles.tag}>Slot list</span>
              <span className={styles.tag}>Status view</span>
            </div>
          </div>
          <div className={styles.flowCard}>
            <h3>Legacy surfaces</h3>
            <p>Starter org, billing, and invites stay behind one low-priority Admin / Legacy entry.</p>
            <div className={styles.flowTagRow}>
              <span className={styles.tag}>Hidden from main nav</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.board}>
        <div className={styles.boardHeader}>
          <h2>Navigation Wireframes</h2>
          <p>Keep primary navigation flat and role-specific. Use bottom nav on mobile for consumers.</p>
        </div>
        <div className={styles.navGrid}>
          <div className={styles.navCard}>
            <h3>Consumer nav</h3>
            <p>Desktop sidebar or top nav, mobile bottom nav.</p>
            <div className={styles.navList}>
              <div className={styles.navItem}>
                <span className={styles.navLabel}>Explore</span>
                <span className={styles.navNote}>Marketplace list and filters</span>
              </div>
              <div className={styles.navItem}>
                <span className={styles.navLabel}>Bookings</span>
                <span className={styles.navNote}>Upcoming and recent reservations</span>
              </div>
              <div className={styles.navItem}>
                <span className={styles.navLabel}>Profile</span>
                <span className={styles.navNote}>Address, role, account info</span>
              </div>
            </div>
          </div>
          <div className={styles.navCard}>
            <h3>Operator nav</h3>
            <p>Sidebar on desktop, compact top nav plus tabs on mobile.</p>
            <div className={styles.navList}>
              <div className={styles.navItem}>
                <span className={styles.navLabel}>Dashboard</span>
                <span className={styles.navNote}>Readiness and quick actions</span>
              </div>
              <div className={styles.navItem}>
                <span className={styles.navLabel}>Slots</span>
                <span className={styles.navNote}>List, filters, post new slot</span>
              </div>
              <div className={styles.navItem}>
                <span className={styles.navLabel}>Studio</span>
                <span className={styles.navNote}>Identity, location, categories</span>
              </div>
              <div className={styles.navItem}>
                <span className={styles.navLabel}>Profile</span>
                <span className={styles.navNote}>Account-level settings only</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.board}>
        <div className={styles.boardHeader}>
          <h2>Consumer Flow</h2>
          <p>Discovery should feel marketplace-first. Each screen has one clear decision.</p>
        </div>
        <div className={styles.frameGrid}>
          <div className={styles.frame}>
            <div className={styles.frameHeader}>
              <div>
                <h3>Consumer Marketplace</h3>
                <p>Primary signed-in landing page</p>
              </div>
              <div className={styles.frameMetaRow}>
                <span className={styles.metaChip}>Route: /marketplace</span>
              </div>
            </div>
            <div className={styles.wireframe}>
              <div className={styles.wireTop}>
                <div className={styles.wireBox}>Top bar: title + location status</div>
                <div className={styles.wireBox}>Profile / Bookings</div>
              </div>
              <div className={styles.wireChipRow}>
                <span className={styles.wireChip}>Class type</span>
                <span className={styles.wireChip}>Start window</span>
                <span className={styles.wireChip}>Max price</span>
                <span className={styles.wireChip}>Min discount</span>
              </div>
              <div className={styles.wireBoxTall}>Results list or card grid: studio, class, time, distance, price, spots, CTA</div>
            </div>
            <Annotation
              goal="Find a bookable class fast"
              primary="Open slot"
              secondary="Adjust filters"
              state="No nearby classes / no matches"
            />
          </div>

          <div className={styles.frame}>
            <div className={styles.frameHeader}>
              <div>
                <h3>Slot Detail</h3>
                <p>Decision page before checkout</p>
              </div>
              <div className={styles.frameMetaRow}>
                <span className={styles.metaChip}>Route: /marketplace/[slotId]</span>
              </div>
            </div>
            <div className={styles.wireframe}>
              <div className={styles.wireSplit}>
                <div className={styles.wireBoxTall}>Hero summary: class, studio, time, address, categories</div>
                <div className={styles.wireBoxTall}>Pricing box: original price, discount, price now, spots left</div>
              </div>
              <div className={styles.wireCta}>Primary CTA: Reserve spot and pay</div>
            </div>
            <Annotation
              goal="Confirm this class is worth booking"
              primary="Reserve spot and pay"
              secondary="Back to marketplace"
              state="Slot filled / locked / unavailable"
            />
          </div>

          <div className={styles.frame}>
            <div className={styles.frameHeader}>
              <div>
                <h3>Booking Confirmation</h3>
                <p>Post-checkout success state</p>
              </div>
              <div className={styles.frameMetaRow}>
                <span className={styles.metaChip}>Route: /marketplace/bookings/[bookingId]</span>
              </div>
            </div>
            <div className={styles.wireframe}>
              <div className={styles.wireBox}>Success / payment status banner</div>
              <div className={styles.wireSplit}>
                <div className={styles.wireBoxTall}>Booking details: class, studio, location, date and time</div>
                <div className={styles.wireBoxTall}>Payment summary and confirmation info</div>
              </div>
              <div className={styles.wireCta}>CTA: Back to marketplace</div>
            </div>
            <Annotation
              goal="Reassure the user their spot is secured"
              primary="Back to marketplace"
              secondary="Open bookings later"
              state="Payment still processing"
            />
          </div>

          <div className={styles.frame}>
            <div className={styles.frameHeader}>
              <div>
                <h3>Consumer Profile</h3>
                <p>Account details and saved location</p>
              </div>
              <div className={styles.frameMetaRow}>
                <span className={styles.metaChip}>Route: /settings/profile</span>
              </div>
            </div>
            <div className={styles.wireframe}>
              <div className={styles.wireBox}>Identity + role summary</div>
              <div className={styles.wireBoxTall}>Saved fallback address and account settings form</div>
              <div className={styles.wireCta}>CTA: Save profile</div>
            </div>
            <Annotation
              goal="Keep consumer info and location current"
              primary="Save profile"
              secondary="Return to marketplace"
              state="No saved address yet"
            />
          </div>
        </div>
      </section>

      <section className={styles.board}>
        <div className={styles.boardHeader}>
          <h2>Operator Flow</h2>
          <p>Operator pages should feel like an operating console, not a settings dump.</p>
        </div>
        <div className={styles.frameGrid}>
          <div className={styles.frame}>
            <div className={styles.frameHeader}>
              <div>
                <h3>Operator Dashboard</h3>
                <p>Summary plus next actions only</p>
              </div>
              <div className={styles.frameMetaRow}>
                <span className={styles.metaChip}>Route: /dashboard</span>
              </div>
            </div>
            <div className={styles.wireframe}>
              <div className={styles.wireTop}>
                <div className={styles.wireBox}>Header: studio status + quick summary</div>
                <div className={styles.wireCta}>Post slot</div>
              </div>
              <div className={styles.wireChipRow}>
                <span className={styles.wireChip}>Studio configured</span>
                <span className={styles.wireChip}>Open slots</span>
                <span className={styles.wireChip}>Filled slots</span>
              </div>
              <div className={styles.wireBoxTall}>Recent slot cards / recent booking activity</div>
            </div>
            <Annotation
              goal="Know what needs action now"
              primary="Post slot"
              secondary="Open slots page"
              state="Studio not configured"
            />
          </div>

          <div className={styles.frame}>
            <div className={styles.frameHeader}>
              <div>
                <h3>Slots List</h3>
                <p>Dedicated slot management area</p>
              </div>
              <div className={styles.frameMetaRow}>
                <span className={styles.metaChip}>New route: /slots</span>
              </div>
            </div>
            <div className={styles.wireframe}>
              <div className={styles.wireTop}>
                <div className={styles.wireChipRow}>
                  <span className={styles.wireChip}>Open</span>
                  <span className={styles.wireChip}>Filled</span>
                  <span className={styles.wireChip}>Locked</span>
                  <span className={styles.wireChip}>Expired</span>
                </div>
                <div className={styles.wireCta}>New slot</div>
              </div>
              <div className={styles.wireBoxTall}>Slot list: class, start time, spots, status, price, quick actions</div>
            </div>
            <Annotation
              goal="Monitor all inventory cleanly"
              primary="New slot"
              secondary="Filter by status"
              state="No slots posted yet"
            />
          </div>

          <div className={styles.frame}>
            <div className={styles.frameHeader}>
              <div>
                <h3>Slot Composer</h3>
                <p>Standalone post-slot screen or sheet</p>
              </div>
              <div className={styles.frameMetaRow}>
                <span className={styles.metaChip}>New route: /slots/new</span>
              </div>
            </div>
            <div className={styles.wireframe}>
              <div className={styles.wireBoxTall}>Form: class type, start time, length, original price, discount %, spots</div>
              <div className={styles.wireBox}>Derived discounted price preview + lock-rule notice</div>
              <div className={styles.wireCta}>CTA: Publish slot</div>
            </div>
            <Annotation
              goal="Create discounted inventory quickly"
              primary="Publish slot"
              secondary="Cancel / back to slots"
              state="Validation errors / locked rules"
            />
          </div>

          <div className={styles.frame}>
            <div className={styles.frameHeader}>
              <div>
                <h3>Studio Profile</h3>
                <p>Identity and marketplace footprint</p>
              </div>
              <div className={styles.frameMetaRow}>
                <span className={styles.metaChip}>Route: /settings/studio</span>
              </div>
            </div>
            <div className={styles.wireframe}>
              <div className={styles.wireSplit}>
                <div className={styles.wireBoxTall}>Studio form: name, slug, address, categories, description</div>
                <div className={styles.wireBoxTall}>Preview / summary: city, categories, slot readiness</div>
              </div>
              <div className={styles.wireCta}>CTA: Save studio profile</div>
            </div>
            <Annotation
              goal="Configure the studio so slots can go live"
              primary="Save studio profile"
              secondary="Open slots"
              state="No studio created yet"
            />
          </div>
        </div>
      </section>

      <section className={styles.board}>
        <div className={styles.boardHeader}>
          <h2>Shell Rule</h2>
          <p>This is the key IA rule driving the wireframes.</p>
        </div>
        <div className={styles.navGrid}>
          <div className={styles.navCard}>
            <h3>What belongs in primary nav</h3>
            <div className={styles.navList}>
              <div className={styles.navItem}><span className={styles.navLabel}>Consumer</span><span className={styles.navNote}>Explore, Bookings, Profile</span></div>
              <div className={styles.navItem}><span className={styles.navLabel}>Operator</span><span className={styles.navNote}>Dashboard, Slots, Studio, Profile</span></div>
            </div>
          </div>
          <div className={styles.navCard}>
            <h3>What gets demoted</h3>
            <div className={styles.navList}>
              <div className={styles.navItem}><span className={styles.navLabel}>Legacy tools</span><span className={styles.navNote}>Org, billing, invites</span></div>
              <div className={styles.navItem}><span className={styles.navLabel}>No dropdowns</span><span className={styles.navNote}>Use separate screens and filter chips instead</span></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
