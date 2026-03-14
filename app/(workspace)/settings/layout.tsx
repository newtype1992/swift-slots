import { SettingsNav } from "./settings-nav";

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid">
      <section className="panel">
        <p className="eyebrow">Settings</p>
        <h1>Swift Slots settings</h1>
        <p className="muted">
          Product settings come first. Inherited starter controls remain available while the app is still being adapted.
        </p>
        <SettingsNav />
      </section>
      {children}
    </div>
  );
}
