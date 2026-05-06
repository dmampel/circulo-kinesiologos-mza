---
name: frontend-atomic-tailwind
description: >
  Follows Atomic Design and Tailwind CSS 4 best practices for UI development.
  Trigger: When creating React components, styling with Tailwind, or organizing the frontend.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- When building new UI components.
- When styling with Tailwind CSS 4.
- To maintain a scalable and organized component library.

## Critical Patterns

- **Atomic Structure**:
  - `atoms/`: Smallest functional units (Button, Input, Badge). No business logic.
  - `molecules/`: Groups of atoms (FormField, SearchBar).
  - `organisms/`: Complex UI sections (Navbar, Footer, Sidebar). Can have data fetching.
- **Tailwind 4**:
  - Use utility classes for layout and spacing.
  - Use CSS variables for theme colors and shared tokens.
  - Avoid large inline styles; extract to components.
- **Logic Separation**:
  - Use custom hooks for complex component state/logic.
  - Keep view components "dumb" where possible.
- **Location**: `src/components/{atoms|molecules|organisms}/`.

## Code Example

```tsx
// src/components/atoms/Button.tsx
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = ({ className, variant = 'primary', ...props }: ButtonProps) => {
  return (
    <button 
      className={cn(
        "px-4 py-2 rounded-md transition-all",
        variant === 'primary' ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800",
        className
      )}
      {...props}
    />
  );
};
```

## Commands

```bash
# Create atomic structure
mkdir -p src/components/atoms src/components/molecules src/components/organisms
```

## Resources

- **Tailwind 4 Docs**: [tailwindcss.com](https://tailwindcss.com)
- **Atomic Design**: [bradfrost.com/blog/post/atomic-web-design/](https://bradfrost.com/blog/post/atomic-web-design/)
