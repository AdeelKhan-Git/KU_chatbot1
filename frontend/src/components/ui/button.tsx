import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow hover:from-blue-700 hover:to-purple-700",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
        outline:
          "border border-[#23242a] bg-[#181A20] text-white shadow-sm hover:bg-[#23242a] hover:text-white",
        secondary: "bg-[#23242a] text-white shadow-sm hover:bg-[#2a2b32]",
        ghost: "text-gray-300 hover:bg-[#23242a] hover:text-white",
        link: "text-blue-400 underline-offset-4 hover:underline hover:text-blue-300",
        reserve:
          "px-6 py-2.5 bg-white text-gray-800 border-none rounded-full text-sm cursor-pointer transition-colors duration-300 ease-in-out hover:bg-gray-800 hover:text-white",
        reserveOpposite:
          "px-6 py-2.5 bg-gray-800 text-white border-none rounded-full text-sm cursor-pointer transition-colors duration-300 ease-in-out hover:bg-gray-500 hover:text-white",
        dark: "bg-[#0C0E16] text-white border border-[#23242a] hover:bg-[#181A20] hover:border-[#2a2b32]",
        primary: "bg-[#1593c9] text-white hover:bg-[#0d709b] shadow-sm",
        success: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700 shadow-sm",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
