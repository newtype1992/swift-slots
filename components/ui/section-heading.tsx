type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function SectionHeading({ eyebrow, title, description, actions }: SectionHeadingProps) {
  return (
    <div className="sectionHeader">
      <div className="stack compactStack">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="sectionHeaderActions">{actions}</div> : null}
    </div>
  );
}
