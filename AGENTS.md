<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Responsive Design Rules

1. **NO FIXED PIXELS**: Never use fixed `px` for spacing (padding, margin), font sizes, or widths unless it's for 1px borders or specific icons. Always use Tailwind's relative scale (`p-4`, `m-2`, `text-lg`).
2. **REM OVER PX**: Prefer `rem` units for custom values. Assume 1rem = 16px.
3. **ADAPTIVE SPACING**: For large components (hero sections, main containers), use responsive prefixes. Example: `p-6 md:p-10 lg:p-16` instead of a single `p-16`.
4. **MAX-WIDTH LIMITS**: Always wrap main layouts in containers with max-width (e.g., `max-w-7xl`) to prevent content from stretching too far on ultra-wide screens.
5. **FLUID TYPOGRAPHY**: For hero headers, use a combination of `text-4xl md:text-6xl lg:text-7xl` to ensure the text scales gracefully.

