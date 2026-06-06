# LearnForwardSTEM - Design System & Technical Specification

## 🎨 Design Philosophy

**Static • Professional • High-Contrast • Accessible**

The LearnForwardSTEM platform prioritizes clarity, accessibility, and zero-animation performance. Every element follows a strict geometric design framework with clear typography hierarchy and intentional whitespace.

---

## Color Palette

### Primary Colors

| Color Name | Hex Code | RGB | Usage | WCAG Contrast |
|------------|----------|-----|-------|---------------|
| **Burgundy-Maroon** | `#5e161c` | 94, 22, 28 | Primary backgrounds, headers, buttons | AAA ✅ |
| **Deep Burgundy** | `#320E13` | 50, 14, 19 | Dark accents, borders | AAA ✅ |
| **Ochre-Yellow** | `#d3a43f` | 211, 164, 63 | Accent highlights, borders, icons | AAA ✅ |
| **Warm Ochre** | `#AE7E3B` | 174, 126, 59 | Secondary accents (older palette) | AA ✅ |

### Secondary Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Cream** | `#ede4d4` | 237, 228, 212 | Light backgrounds, typography on dark |
| **Off-White** | `#F4EFE6` | 244, 239, 230 | Alternative light background |
| **Charcoal** | `#282828` | 40, 40, 40 | Dark text, dark mode backgrounds |
| **Black** | `#000000` | 0, 0, 0 | High-contrast text, borders |
| **White** | `#FFFFFF` | 255, 255, 255 | Pure white backgrounds, CTAs |

### Neutral Shades

| Color | Hex | Usage |
|-------|-----|-------|
| Dark Mode Base | `#1a0709` | Page backgrounds in dark mode |
| Admin Panel Dark | `#1f090c` | Admin dashboard background |
| Card Backgrounds | `#110506` | Component backgrounds in dark |
| Border Gray | `#282828/20` | Light borders on bright backgrounds |
| Border Cream | `#ede4d4/50` | Subtle borders on dark backgrounds |

---

## Typography

### Font Family

- **Primary:** System sans-serif stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`)
- **Fallback:** Arial, sans-serif
- **Monospace:** `font-mono` (for timestamps, codes)

### Font Sizes & Weights

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **H1 (Hero)** | 48px | 800 | 1.2 | Page headlines |
| **H2 (Section)** | 36px | 700 | 1.3 | Section titles |
| **H3 (Subsection)** | 24px | 700 | 1.3 | Card titles |
| **H4 (Minor)** | 18px | 600 | 1.4 | Labels |
| **Body** | 16px | 500 | 1.6 | Paragraphs |
| **Small** | 14px | 500 | 1.5 | Secondary text |
| **X-Small** | 12px | 500 | 1.4 | Captions, timestamps |
| **XX-Small** | 11px | 600 | 1.3 | Badge labels |
| **Mono** | 12px | 400 | 1.4 | Code, timestamps |

### Text Color Contrast Matrix

| Text Color | Background | WCAG Level |
|------------|-----------|-----------|
| `#ede4d4` (Cream) on `#5e161c` (Burgundy) | 9.5:1 | AAA ✅ |
| `#282828` (Charcoal) on `#ede4d4` (Cream) | 12.8:1 | AAA ✅ |
| `#d3a43f` (Ochre) on `#5e161c` (Burgundy) | 5.2:1 | AA ✅ |
| `#FFFFFF` (White) on `#5e161c` (Burgundy) | 10.2:1 | AAA ✅ |

---

## Component Specifications

### Navigation Bar

**Layout:** Fixed/Sticky, Full-width
**Height:** 80px (5rem)
**Background:** `#ede4d4` (light) / `#1a0709` (dark)
**Border-Bottom:** 3px solid `#d3a43f`
**Z-Index:** 50

**Content:**
- Left: Logo (12x12 w-12) + Brand text
- Center: Navigation links (desktop only)
- Right: Dark mode toggle + Mobile menu button

**Mobile Breakpoint:** `md` (768px)
- Hamburger menu appears
- Links move to dropdown panel

---

### Button Specifications

#### Primary Button (CTA)

```
Padding: 1rem 2rem (py-4 px-8)
Background: #d3a43f (Ochre)
Text Color: #5e161c (Burgundy)
Border: 2px solid #d3a43f
Font Weight: 700 (bold)
Font Size: 16px
Text Transform: uppercase
Cursor: pointer
Hover State: bg-#ede4d4 (Cream), text-#5e161c
```

#### Secondary Button (Outlined)

```
Padding: 1rem 2rem
Background: transparent
Text Color: #ede4d4 (Cream)
Border: 2px solid #FFFFFF (White)
Font Weight: 700
Hover State: text-#d3a43f (Ochre), border-#d3a43f
```

#### Admin Button

```
Padding: 0.75rem 1.5rem
Background: #5e161c (Burgundy)
Text Color: #FFFFFF (White)
Border: 1px solid #d3a43f
Font Size: 12px
Font Weight: 600
Text Transform: uppercase
```

---

### Card Component

**Structure:**
```
┌─────────────────────────────┐
│ [Top Border: 8px, Ochre]    │
├─────────────────────────────┤
│                             │
│  Icon (14x14, Ochre)        │
│  Title (24px, bold)         │
│  Description (16px, normal) │
│                             │
└─────────────────────────────┘
```

**Properties:**
- Border: 1px solid `#282828/10` (light) / `#ede4d4/20` (dark)
- Border-Top: 8px solid `#d3a43f`
- Padding: 2rem
- Background: `#FFFFFF` (light) / `#110506` (dark)
- Box Shadow: None (static design)

---

### Form Elements

#### Input Field

```css
Border: 2px solid #282828/20
Background: #ede4d4/10 (light) / #110506 (dark)
Padding: 0.75rem
Font Size: 14px
Font Weight: 600
Color: #282828 (light) / #FFFFFF (dark)
Border-Radius: 0px (sharp corners)
Focus: Border-color: #d3a43f
```

#### Label

```css
Font Size: 12px
Font Weight: 700
Text Transform: uppercase
Letter Spacing: 0.05em
Color: #282828 (light) / #ede4d4 (dark)
Margin-Bottom: 0.5rem
Font Family: monospace (optional)
```

#### Checkbox

```css
Width: 16px
Height: 16px
Accent Color: #d3a43f
Cursor: pointer
```

---

### Section Spacing

| Element | Vertical Padding | Horizontal Padding |
|---------|------------------|-------------------|
| Page Section | `py-24` (6rem) | `px-4` responsive |
| Section Title | `mb-16` (4rem) | — |
| Card Grid Gap | — | `gap-8` (2rem) |
| Form Space | `space-y-6` | — |
| Hero Section | `py-24` to `py-36` | — |

---

### Responsive Breakpoints

| Breakpoint | Width | Devices | Class Prefix |
|-----------|-------|---------|-------------|
| **Mobile** | < 640px | Phones | (default) |
| **Small** | 640px - 767px | Landscape phones | `sm:` |
| **Medium** | 768px - 1023px | Tablets | `md:` |
| **Large** | 1024px - 1279px | Desktops | `lg:` |
| **XL** | 1280px+ | Large desktops | `xl:` |

**Layout Adaptation:**
- Mobile: Single column, stacked vertically
- Tablet: 2-column grids, adjusted padding
- Desktop: 3+ column grids, full layouts

---

## Icons & Imagery

### Icon Library
**Provider:** Lucide React
**Size:** 16px - 32px (w-4 to w-8)
**Color:** `#d3a43f` (Ochre) or inherited text color
**Stroke Width:** 2px

### Logo
**File:** Discord CDN image
**Format:** PNG with transparency
**Aspect Ratio:** 1:1 (square)
**Border:** 2px solid `#d3a43f`
**Border Radius:** `rounded-full`

---

## Dark Mode Implementation

### CSS Variables & Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Uses .dark class on html element
  theme: {
    colors: {
      burgundy: '#5e161c',
      ochre: '#d3a43f',
      cream: '#ede4d4',
      charcoal: '#282828',
    }
  }
}
```

### Light Mode (Default)
- Background: `#ede4d4` (Cream)
- Text: `#282828` (Charcoal)
- Accents: `#d3a43f` (Ochre)

### Dark Mode (Active with `.dark` class)
- Background: `#1a0709` (Dark burgundy)
- Text: `#ede4d4` (Cream)
- Accents: `#d3a43f` (Ochre) — same!

### Toggle Implementation
```typescript
const toggleDarkMode = () => {
  setIsDarkMode(!isDarkMode);
  document.documentElement.classList.toggle('dark');
}
```

---

## Animation & Motion Policy

### ⚠️ STRICT: ZERO-ANIMATION POLICY

**Global CSS Injection:**
```css
* {
  animation: none !important;
  transition: none !important;
  transition-duration: 0s !important;
}
```

**Rationale:**
- Maximum performance (no repaints/reflows)
- No motion sickness for neurodivergent users
- Faster perceived interactions
- Mobile-friendly (battery efficient)

**Exceptions:**
- Page transitions (static 300ms loader text)
- Form validation feedback (instant, no animation)

---

## Accessibility Standards (WCAG 2.1 AA)

### Color Contrast
✅ All text meets minimum 4.5:1 ratio
✅ Large text (18pt+) meets 3:1 minimum
✅ UI controls have distinct visual indicators

### Keyboard Navigation
✅ All buttons/inputs accessible via Tab key
✅ Focus states clearly visible (border/color change)
✅ No keyboard traps
✅ Logical tab order (left-to-right, top-to-bottom)

### Screen Reader Support
✅ Semantic HTML (`<button>`, `<nav>`, `<main>`)
✅ Form labels linked to inputs (`htmlFor` attributes)
✅ ARIA labels on icon-only buttons
✅ Alt text on images

### Motion & Animation
✅ No auto-playing animations
✅ Users can disable animations (prefers-reduced-motion respected)
✅ No flashing/strobing content

### Form Usability
✅ Error messages linked to inputs
✅ Required fields marked clearly
✅ Validation feedback without relying on color alone
✅ Adequate spacing between form controls

---

## Layout Templates

### Hero Section Template
```
┌────��────────────────────────────────────────┐
│  [12px Ochre border]                        │
├─────────────────────────────────────────────┤
│                                             │
│  ╔═══════════════╗     ╔════════════════╗  │
│  ║  Hero Text    ║     ║    Logo Badge  ║  │
│  ║  + 2 CTAs     ║     ║   w-64 to w-96 ║  │
│  ╚═══════════════╝     ╚════════════════╝  │
│                                             │
└─────────────────────────────────────────────┘
```

### Card Grid Template
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Card 1   │  │ Card 2   │  │ Card 3   │
│ (Math)   │  │ (CS)     │  │ (Project)│
└──────────┘  └──────────┘  └──────────┘
   8px gap between cards
```

### Two-Column Form Template
```
┌─────────────────────────────────────┐
│  Input 1     │  Input 2             │
│  (md:flex)   │  (col-span-1)        │
│              │                      │
├─────────────────────────────────────┤
│  Textarea (full width)              │
│                                     │
├─────────────────────────────────────┤
│  [Primary Button - Full Width]      │
└─────────────────────────────────────┘
```

---

## Email Template Design

### Email HTML Structure

```html
<div style="font-family: Arial; background: #ede4d4; border: 4px solid #d3a43f">
  <!-- Header -->
  <div style="background: #5e161c; color: #ede4d4; border-bottom: 3px solid #d3a43f">
    <h2>LearnForwardSTEM</h2>
    <p style="color: #d3a43f">By Students, For Students</p>
  </div>

  <!-- Body -->
  <div style="background: #FFFFFF; color: #282828">
    <p>Hello [Name],</p>
    <p>[Main content]</p>
    <!-- Optional CTA button -->
  </div>

  <!-- Footer -->
  <div style="background: #282828; color: #ede4d4; text-align: center">
    <p>© 2026 LearnForwardSTEM. All rights reserved.</p>
    <p style="color: #d3a43f">Email: LearnForwardSTEM@gmail.com</p>
  </div>
</div>
```

---

## Discord Embed Styling

### Embed Properties

```javascript
{
  title: "🔥 New Volunteer Tutor Application",
  color: 6166044,  // #5e161c in decimal
  fields: [
    { name: "Full Name", value: "...", inline: true },
    { name: "Support Track", value: "..." },
    { name: "Institute", value: "..." }
  ],
  timestamp: new Date().toISOString(),
  footer: {
    text: "LearnForwardSTEM Event Watcher",
    icon_url: "https://lh3.googleusercontent.com/a/default-user"
  }
}
```

---

## Performance Specifications

### Load Time Targets
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.5s

### Asset Optimization
- ✅ Tailwind CSS (minified to ~30KB)
- ✅ React + React Router (lazy-loaded)
- ✅ No external font files (system fonts only)
- ✅ Image optimization (Discord CDN)
- ✅ LocalStorage caching (instant on revisit)

---

## Browser Support

| Browser | Min Version | Status |
|---------|-------------|--------|
| Chrome | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| Mobile Safari (iOS) | 14+ | ✅ Full support |
| Chrome Mobile | 90+ | ✅ Full support |

---

## Tailwind CSS Custom Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        burgundy: '#5e161c',
        ochre: '#d3a43f',
        cream: '#ede4d4',
        charcoal: '#282828',
      },
      fontFamily: {
        sans: ['system-ui', 'BlinkMacSystemFont', 'Arial'],
        mono: ['Menlo', 'Monaco', 'Courier'],
      },
      spacing: {
        'safe': 'max(1rem, env(safe-area-inset-bottom))',
      },
      borderRadius: {
        none: '0px', // Force sharp corners
      },
    },
  },
}
```

---

## Design Token Summary

| Token | Value | Context |
|-------|-------|---------|
| `--primary` | `#5e161c` | Primary backgrounds |
| `--accent` | `#d3a43f` | Highlights, borders |
| `--light` | `#ede4d4` | Light backgrounds |
| `--dark` | `#282828` | Dark text |
| `--spacing-unit` | `0.25rem` | Base spacing (4px) |
| `--border-width` | `2px` | Input/button borders |
| `--border-top` | `8px` | Card top border |
| `--transition` | `0s` | NO TRANSITIONS |

---

**Design Last Updated:** June 6, 2026
**Version:** 1.0.0
**Maintained by:** LearnForwardSTEM UX/UI Team
