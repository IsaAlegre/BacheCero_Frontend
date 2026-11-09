export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight lg:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
