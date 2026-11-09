import { useId } from 'react'

const FIELD = 'w-full rounded-xl border bg-surface px-3.5 text-base text-ink placeholder:text-muted/80 '
  + 'focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-orange/60'

// Campo con label, ayuda y error accesibles. as="textarea" | "select" | "input".
export default function Input({ label, error, hint, as: Tag = 'input', className = '', children, ...props }) {
  const id = useId()
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{label}</label>}
      <Tag
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${FIELD} ${Tag === 'textarea' ? 'py-2.5' : 'h-11'} ${error ? 'border-red-500 dark:border-red-400' : 'border-line'}`}
        {...props}
      >
        {children}
      </Tag>
      {error && <p id={`${id}-err`} className="mt-1 text-sm font-medium text-red-700 dark:text-red-300">{error}</p>}
      {!error && hint && <p id={`${id}-hint`} className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  )
}
