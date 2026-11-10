import { Link } from 'react-router-dom'

const VARIANTS = {
  primary: 'bg-navy text-white hover:bg-navy-800 dark:bg-navy-300 dark:text-navy-950 dark:hover:bg-navy-200',
  // Naranja con texto oscuro: el blanco sobre #f28c28 no llega al contraste mínimo.
  action: 'bg-orange text-navy-950 hover:bg-orange-dark shadow-sm',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-navy hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-surface-2',
  success: 'bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-500',
  danger: 'border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-400/50 dark:text-red-300 dark:hover:bg-red-500/10',
}

const SIZES = {
  sm: 'min-h-9 px-3 text-sm pointer-coarse:min-h-11',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-14 px-5 text-base',
}

export function buttonClass({ variant = 'primary', size = 'md', block = false, className = '' } = {}) {
  return [
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTS[variant], SIZES[size], block ? 'w-full' : '', className,
  ].join(' ')
}

export default function Button({ variant, size, block, className, to, type = 'button', ...props }) {
  const cls = buttonClass({ variant, size, block, className })
  if (to) return <Link to={to} className={cls} {...props} />
  return <button type={type} className={cls} {...props} />
}
