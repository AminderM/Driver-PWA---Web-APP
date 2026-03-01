import * as React from 'react'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cn } from '@/lib/utils'

const toggleVariants = {
  base: "inline-flex items-center justify-center gap-2 text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 outline-none transition-colors whitespace-nowrap",
  variant: {
    default: 'bg-transparent',
    outline: 'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground',
  },
  size: {
    default: 'h-9 px-2 min-w-9',
    sm: 'h-8 px-1.5 min-w-8',
    lg: 'h-10 px-2.5 min-w-10',
  },
}

const Toggle = React.forwardRef(({ 
  className, 
  variant = 'default', 
  size = 'default', 
  ...props 
}, ref) => {
  return (
    <TogglePrimitive.Root
      ref={ref}
      data-slot="toggle"
      className={cn(
        toggleVariants.base,
        toggleVariants.variant[variant],
        toggleVariants.size[size],
        className
      )}
      {...props}
    />
  )
})

Toggle.displayName = 'Toggle'

export { Toggle, toggleVariants }
