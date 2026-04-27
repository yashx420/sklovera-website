# Design System Document: The Editorial Glassware Platform

## 1. Overview & Creative North Star: "The Digital Curator"
This design system is built to bridge the gap between high-end Italian craftsmanship and Scandinavian functionalism. Our Creative North Star is **The Digital Curator**—a philosophy that treats every screen like a high-end editorial spread in a luxury architecture magazine.

To move beyond the "template" look of standard B2B platforms, we reject rigid, boxed-in grids in favor of **intentional asymmetry** and **tonal depth**. The interface should feel like light passing through fine crystal: airy, layered, and sophisticated. We prioritize negative space as a primary design element, allowing the glassware products to breathe and command authority.

---

### 2. Colors & Tonal Depth
Our palette is anchored in ivory and charcoal, with "Deep Glass Green" serving as the signature of quality.

#### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for sectioning. We define boundaries through **background shifts** or **tonal transitions**. For example, a `surface-container-low` section should sit directly on a `surface` background to create a logical break without visual noise.

#### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine paper or frosted glass.
- **Background (`#faf9f7`):** The canvas.
- **Surface Tiers:** Use `surface-container-lowest` for floating cards and `surface-container-highest` for recessed utility areas (like sidebars).
- **Glass & Gradient Rule:** For floating navigation or modal overlays, use **Glassmorphism**. Apply a semi-transparent `surface` color with a `24px` backdrop-blur. 
- **Signature Textures:** For primary CTAs, use a subtle linear gradient from `primary` (#303030) to `primary-container` (#474646) at a 135-degree angle to provide a metallic, satin-like finish.

---

### 3. Typography: The Editorial Contrast
We use a high-contrast pairing to balance heritage (Serif) with modern efficiency (Sans-Serif).

*   **Headings (Noto Serif):** Used for `display` and `headline` scales. This is our "Editorial Voice." Large-scale serif type should feel authoritative and expensive. Use `display-lg` for hero statements and `headline-md` for product categories.
*   **Body & Utility (Manrope):** Used for `title`, `body`, and `label` scales. Manrope provides a clean, technical counterpoint to the serif headers. It ensures maximum readability for B2B logistics, SKU numbers, and pricing.

---

### 4. Elevation & Depth: Tonal Layering
We do not use structural lines to create hierarchy; we use light and shadow.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural lift. This "Paper-on-Paper" effect is the hallmark of luxury minimalism.
*   **Ambient Shadows:** For elements that truly float (modals, dropdowns), use a custom shadow: `0px 24px 48px rgba(26, 28, 27, 0.06)`. The shadow must be a tinted version of `on-surface` at 6% opacity—never pure black.
*   **The Ghost Border:** If a boundary is required for accessibility (e.g., input fields), use a "Ghost Border": the `outline-variant` token at **15% opacity**. 100% opaque borders are forbidden.

---

### 5. Components & Primitives

#### Buttons
- **Primary:** Charcoal (`primary`) with ivory text. Subtle `0.25rem` (DEFAULT) rounding. Use the satin gradient for hover states.
- **Secondary:** Deep Glass Green (`secondary`). Use for "Request Quote" or "Add to Collection."
- **Tertiary:** Text-only with a `label-md` weight. No box, just an elegant underline on hover.

#### Input Fields
Text inputs should not be boxes. Use a background of `surface-container-low` with a `Ghost Border` at the bottom only. The label should use `label-sm` in `on-surface-variant`.

#### Cards & Lists
**Forbid the use of divider lines.** Separate list items using `body-lg` vertical spacing. For product cards, use an asymmetrical layout where the image slightly overlaps the card boundary, creating a "layered" look that breaks the standard grid.

#### Signature Component: The Glassware Specification Drawer
A high-end B2B feature using **Glassmorphism**. When a user selects a SKU, a side-panel emerges with a `backdrop-blur(16px)` and 80% opacity `surface-container-lowest`. It feels like an overlaying sheet of vellum.

---

### 6. Do's and Don'ts

#### Do
- **Do** use whitespace as a separator. If you think you need a line, try adding `32px` of space instead.
- **Do** use `tertiary-fixed` (Champagne Gold) for micro-interactions, such as "Premium" badges or selected stars.
- **Do** use "Deep Glass Green" (`secondary`) for all success states and sustainability certifications.

#### Don't
- **Don't** use 100% black. Always use Charcoal (`#303030`) to keep the "industrial-minimal" tone soft.
- **Don't** use "Extra-Large" (`xl`) rounding. Stick to `sm` (0.125rem) or `md` (0.375rem) to maintain a crisp, professional edge.
- **Don't** use standard "Error Red" for subtle mistakes. Use `error-container` with `on-error-container` text to keep the palette sophisticated even in failure states.

---

### 7. Accessibility Note
While we prioritize "Light-on-Light" layering, ensure all text-on-background pairings meet WCAG AA standards. The `on-surface-variant` (#414846) is the lightest grey allowed for body-sized text. Anything lighter should be reserved for decorative labels.