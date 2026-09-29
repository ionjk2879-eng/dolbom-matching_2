import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'outline' | 'dark'

const styles: Record<Variant, string> = {
  primary: 'bg-green text-white hover:opacity-90',
  outline: 'bg-transparent text-ink border border-line-2 hover:bg-ivory-deep',
  dark: 'bg-ink text-white hover:opacity-90',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}
