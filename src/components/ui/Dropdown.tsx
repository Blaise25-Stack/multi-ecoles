import { useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { useClickOutside } from '@/hooks/useClickOutside'

interface DropdownProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}

const Dropdown = ({
  trigger,
  children,
  align = 'right',
  className,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen)

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[180px] rounded-lg shadow-elevated',
            'bg-white dark:bg-surface-800',
            'border border-surface-200 dark:border-surface-700',
            'py-1 animate-fade-in',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface DropdownItemProps {
  children: ReactNode
  onClick?: () => void
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  className?: string
}

const DropdownItem = ({
  children,
  onClick,
  icon,
  danger = false,
  disabled = false,
  className,
}: DropdownItemProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'flex w-full items-center gap-2 px-4 py-2 text-sm text-left',
      'transition-colors',
      danger
        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
        : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}
  >
    {icon && <span className="w-4 h-4">{icon}</span>}
    {children}
  </button>
)

const DropdownDivider = () => (
  <hr className="my-1 border-surface-200 dark:border-surface-700" />
)

export { Dropdown, DropdownItem, DropdownDivider }



