---
name: Professional Modern Light
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#564336'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#8a7264'
  outline-variant: '#ddc1b1'
  surface-tint: '#964900'
  primary: '#964900'
  on-primary: '#ffffff'
  primary-container: '#f38020'
  on-primary-container: '#592900'
  inverse-primary: '#ffb787'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#006591'
  on-tertiary: '#ffffff'
  tertiary-container: '#00a9f0'
  on-tertiary-container: '#003a56'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc7'
  primary-fixed-dim: '#ffb787'
  on-primary-fixed: '#311300'
  on-primary-fixed-variant: '#723600'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin: 24px
  container-max: 1280px
---

## Brand & Style
This design system is built for high-performance SaaS and technical environments that require absolute clarity and professional vigor. The brand personality is efficient, energetic, and authoritative, moving away from the moody depths of dark modes toward a bright, high-utility workspace.

The design style is **Corporate / Modern** with a focus on **Minimalism**. It utilizes a "White Label" philosophy where the interface recedes to let the content lead, punctuated by high-energy orange accents that guide the user's eye to primary actions. The visual language favors precision, utilizing generous whitespace and subtle tonal shifts to define hierarchy rather than heavy ornamentation.

## Colors
The color palette is anchored by a crisp `#ffffff` primary surface to ensure maximum readability and a modern, airy feel. Secondary containers use a cool, subtle grey (`#f8f9fa`) to create logical grouping without introducing visual noise.

The primary accent is a vibrant Cloudflare Orange (`#f38020`), reserved strictly for primary calls to action, active states, and critical progress indicators. Typography utilizes a range of high-contrast dark greys to maintain WCAG AAA compliance on light backgrounds. Status colors are saturated and calibrated for light-mode visibility, ensuring that alerts and successes are immediately distinguishable.

## Typography
The design system exclusively utilizes **Hanken Grotesk**, a typeface chosen for its technical precision and contemporary geometric construction. 

Headline levels utilize a bold weight with slight negative letter-spacing to create a "dense" professional look, perfect for dashboard titles and marketing headers. Body text remains generous in line-height to facilitate long-form reading and data density. For mobile interfaces, headlines scale down to prevent awkward wrapping, while maintaining the same weight hierarchy to preserve brand intent.

## Layout & Spacing
This design system follows a **Fixed Grid** model for desktop and a **Fluid Grid** for mobile. The layout is structured on a 12-column system with a 24px gutter, ensuring that elements align with mathematical rigor.

The spacing rhythm is strictly based on a 4px baseline. All padding and margins must be increments of 4px or 8px. Use `lg` (24px) for major component separation and `md` (16px) for internal container padding. On mobile devices, side margins should be reduced to 16px to maximize the utility of the smaller viewport, and the 12-column grid collapses into a single vertical stack.

## Elevation & Depth
Depth in this design system is achieved through **Tonal Layers** and **Ambient Shadows**. Because the background is a flat white, depth is vital for distinguishing between the canvas and interactive elements.

- **Level 0 (Canvas):** Pure white (#ffffff).
- **Level 1 (Sub-containers):** Subtle grey (#f8f9fa) with no shadow, often used for sidebars or background sections.
- **Level 2 (Cards/Modals):** Pure white with a very soft, diffused shadow (Blur: 12px, Y: 4px, Color: rgba(0, 0, 0, 0.05)).
- **Level 3 (Overlays):** Used for menus and tooltips, featuring a sharper shadow and a 1px border (#e5e7eb) to ensure separation from Level 2 items.

## Shapes
The shape language is **Soft**, striking a balance between the clinical feel of sharp corners and the overly casual nature of pill shapes. 

Standard components like buttons and input fields use a 0.25rem (4px) radius. Larger containers, such as cards and data tables, use a 0.5rem (8px) radius. This conservative use of rounding reinforces the professional and structured nature of the design system while softening the edges for a modern user experience.

## Components

### Buttons
- **Primary:** Solid `#f38020` with white text. High-contrast, no gradient.
- **Secondary:** Transparent background with a 1px border of `#e5e7eb` and `#111827` text.
- **Tertiary/Ghost:** No border or background, orange text.

### Input Fields
Inputs use the Level 0 white background with a 1px border of `#e5e7eb`. On focus, the border transitions to `#f38020` with a subtle 2px outer glow of the same color at 15% opacity. Labels should be positioned above the field using `body-sm` in bold.

### Cards
Cards are the primary container for information. They feature a white surface, an 8px corner radius, and a 1px border of `#f8f9fa` or a Level 2 shadow.

### Chips & Badges
Chips use a light grey fill (`#f3f4f6`) with dark grey text. Status badges (Success, Error) use a 10% opacity version of their respective status color for the background and the 100% saturated color for the text and a small leading icon.

### Lists
Lists should utilize the `md` spacing (16px) for vertical padding between items, with a subtle `#f3f4f6` 1px divider between rows. Interactive list items should have a hover state of `#f8f9fa`.