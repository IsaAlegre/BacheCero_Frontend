export default function Spinner({ label = 'Cargando…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-muted">
      <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {label}
    </div>
  )
}
