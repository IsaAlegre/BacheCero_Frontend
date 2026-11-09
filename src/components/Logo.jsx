export default function Logo({ className = 'size-9' }) {
  return <img src="/icon.svg" alt="" className={`rounded-xl ${className}`} />
}

export function Brand({ subtitle, className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Logo />
      <span className="leading-tight">
        <span className="block text-lg font-extrabold tracking-tight">Bache Cero</span>
        {subtitle && <span className="block text-xs font-medium opacity-80">{subtitle}</span>}
      </span>
    </span>
  )
}
