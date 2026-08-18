'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, VariantProps } from 'class-variance-authority';
import { Check, Minus } from 'lucide-react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

// Define the variants for the Checkbox using cva.
const checkboxVariants = cva(
  `
    group peer bg-white shrink-0 rounded-md border border-neutral-300 ring-offset-white focus-visible:outline-none 
    focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 
    data-[state=checked]:bg-[#c3943a] data-[state=checked]:border-[#c3943a] data-[state=checked]:text-white 
    data-[state=indeterminate]:bg-[#c3943a] data-[state=indeterminate]:border-[#c3943a] data-[state=indeterminate]:text-white
    `,
  {
    variants: {
      size: {
        sm: 'size-4.5 [&_svg]:size-3',
        md: 'w-5 h-5 [&_svg]:w-3.5 [&_svg]:h-3.5',
        lg: 'size-5.5 [&_svg]:size-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

function Checkbox({
  className,
  size,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & VariantProps<typeof checkboxVariants>) {
  return (
    <CheckboxPrimitive.Root data-slot="checkbox" className={cn(checkboxVariants({ size }), className)} {...props}>
      <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
        <Check strokeWidth={3} className="group-data-[state=indeterminate]:hidden" />
        <Minus strokeWidth={3} className="hidden group-data-[state=indeterminate]:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
