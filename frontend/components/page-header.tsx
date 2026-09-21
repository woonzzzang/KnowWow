export function PageHeader({eyebrow, title, description, action}: {eyebrow?: string; title: string; description: string; action?: React.ReactNode}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted sm:text-base">{description}</p>
      </div>
      {action}
    </div>
  );
}

