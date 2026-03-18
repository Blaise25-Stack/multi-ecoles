import type { ReactNode, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// Table Container
interface TableContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const TableContainer = ({ children, className, ...props }: TableContainerProps) => (
  <div
    className={cn(
      'overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700',
      'bg-white dark:bg-surface-800',
      className
    )}
    {...props}
  >
    {children}
  </div>
)

// Table
interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode
}

const Table = ({ children, className, ...props }: TableProps) => (
  <table className={cn('w-full text-sm', className)} {...props}>
    {children}
  </table>
)

// Table Head
interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode
}

const TableHead = ({ children, className, ...props }: TableHeadProps) => (
  <thead
    className={cn('bg-surface-50 dark:bg-surface-900/50', className)}
    {...props}
  >
    {children}
  </thead>
)

// Table Body
interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode
}

const TableBody = ({ children, className, ...props }: TableBodyProps) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props}>
    {children}
  </tbody>
)

// Table Row
interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode
  clickable?: boolean
}

const TableRow = ({ children, className, clickable, ...props }: TableRowProps) => (
  <tr
    className={cn(
      'border-b border-surface-100 dark:border-surface-800',
      'transition-colors',
      clickable && 'cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50',
      className
    )}
    {...props}
  >
    {children}
  </tr>
)

// Table Header Cell
interface TableThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode
  sortable?: boolean
  sorted?: 'asc' | 'desc' | false
  onSort?: () => void
}

const TableTh = ({
  children,
  className,
  sortable,
  sorted,
  onSort,
  ...props
}: TableThProps) => (
  <th
    className={cn(
      'px-4 py-3 text-left font-semibold text-surface-700 dark:text-surface-300',
      'border-b border-surface-200 dark:border-surface-700',
      sortable && 'cursor-pointer select-none hover:text-surface-900 dark:hover:text-surface-100',
      className
    )}
    onClick={sortable ? onSort : undefined}
    {...props}
  >
    <div className="flex items-center gap-2">
      {children}
      {sortable && sorted && (
        <span className="text-primary-600 dark:text-primary-400">
          {sorted === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </div>
  </th>
)

// Table Cell
interface TableTdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode
}

const TableTd = ({ children, className, ...props }: TableTdProps) => (
  <td
    className={cn(
      'px-4 py-3 text-surface-900 dark:text-surface-100',
      className
    )}
    {...props}
  >
    {children}
  </td>
)

// Empty State
interface TableEmptyProps {
  message?: string
  colSpan: number
}

const TableEmpty = ({ message = 'Aucune donnée disponible', colSpan }: TableEmptyProps) => (
  <tr>
    <td
      colSpan={colSpan}
      className="px-4 py-12 text-center text-surface-500 dark:text-surface-400"
    >
      {message}
    </td>
  </tr>
)

// Loading Skeleton
interface TableSkeletonProps {
  rows?: number
  columns: number
}

const TableSkeleton = ({ rows = 5, columns }: TableSkeletonProps) => (
  <>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <tr key={rowIndex} className="border-b border-surface-100 dark:border-surface-800">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <td key={colIndex} className="px-4 py-3">
            <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
          </td>
        ))}
      </tr>
    ))}
  </>
)

export {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
  TableEmpty,
  TableSkeleton,
}



