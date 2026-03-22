import Link from "next/link";

type DealCardTone = "navy" | "coral" | "teal" | "slate" | "gold";

type DealCardProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  price: string;
  originalPrice?: string | null;
  badges?: string[];
  href: string;
  ctaLabel: string;
  tone?: DealCardTone;
  visualLabel?: string;
};

export function DealCard({
  eyebrow,
  title,
  subtitle,
  price,
  originalPrice,
  badges = [],
  href,
  ctaLabel,
  tone = "navy",
  visualLabel,
}: DealCardProps) {
  return (
    <article className="dealCard">
      <div className={`dealCardMedia dealCardMedia-${tone}`}>
        <span className="dealCardPill">{eyebrow}</span>
        <span className="dealCardVisualLabel">{visualLabel ?? title}</span>
      </div>
      <div className="dealCardBody">
        <div className="dealCardHeader">
          <div className="stack compactStack">
            <strong>{title}</strong>
            <span className="helper">{subtitle}</span>
          </div>
          <div className="dealCardPrice">
            <strong>{price}</strong>
            {originalPrice ? <span>{originalPrice}</span> : null}
          </div>
        </div>
        {badges.length > 0 ? (
          <div className="dealCardMeta">
            {badges.map((badge) => (
              <span key={badge} className="dealCardTag">
                {badge}
              </span>
            ))}
          </div>
        ) : null}
        <div className="actions">
          <Link href={href} className="button">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
