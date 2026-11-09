export default function Card({ as: Tag = 'div', className = '', padded = true, ...props }) {
  return (
    <Tag
      className={`rounded-2xl border border-line bg-surface shadow-sm ${padded ? 'p-4' : ''} ${className}`}
      {...props}
    />
  )
}

export function CardTitle({ children, action, className = '' }) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-2 ${className}`}>
      <h2 className="text-base font-bold">{children}</h2>
      {action}
    </div>
  )
}
