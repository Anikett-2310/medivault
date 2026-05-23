# MediVault – Premium Healthcare OS Design System

## Visual Philosophy
Hybrid identity: 60% clean professional healthcare platform + 40% futuristic intelligent medical OS. Blends Vital Systems (advanced hospital operations center), Blueprint Intelligence (pharmaceutical process infrastructure), and Clinical Precision (trustworthy data, healthcare professionalism). Operationally intelligent without crypto/AI SaaS aesthetics. **CONTROLLED VISUAL RICHNESS**: strengthened role accent colors with boosted chroma (0.25–0.28) for vibrant recognition across themes, vibrant persistent hue identity (Patient teal 185°, Pharmacy amber 75°, Hospital blue 245°, Diagnostic purple 295°, Admin crimson 15°), true 4-layer surface hierarchy with distinct visual depths (0.07→0.11→0.16→0.19 dark, 0.91→0.95→0.98→1.0 light), restored color energy on focal points, improved text readability (secondary text +0.04 lightness), role-specific atmospheric touches.

## Foundation
**Dark Mode**: Deep navy-slate foundation (0.07 lightness) with 4-tier surface hierarchy — base (0.07), surface (0.11), elevated (0.16), card (0.19), active (0.22). Blueprint visual language with subtle grid overlays, operational panels, structured process flows. Controlled atmospheric depth via modest ambient gradients. Surgical precision with vibrant indigo/cyan accents (chroma 0.28).
**Light Mode**: Cool gray baseline (0.91 lightness) clinical workstation aesthetic. 4-tier surfaces — base (0.91), surface (0.95), elevated (0.98), card (1.0), active (0.96). Layered soft white elevated surfaces, restrained borders, clean 5-tier elevation system. Healthcare-trustworthy. No warm tones.

## Color System — OKLCH (OKLCH values, never wrapped in other color functions)

### Background & Surface Layers (4-Tier Hierarchy with Enhanced Separation)
| Layer | Light | Dark | Purpose |
|-------|-------|------|----------|
| **Base** | 0.91 0.008 245 | 0.07 0.012 245 | Global app background, distinct from surface |
| **Surface** | 0.95 0.005 245 | 0.11 0.010 245 | Card containers, section panels, noticeably elevated |
| **Elevated** | 0.98 0.003 240 | 0.16 0.008 245 | Prominent cards, modals, clearly distinct |
| **Card** | 1.0 0.000 0 | 0.19 0.006 245 | Card interior, highest light surface |
| **Active** | 0.96 0.012 245 | 0.22 0.008 250 | Focused/active operational elements, interaction states |

### Typography Hierarchy (Improved Text Contrast)
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| text-primary | 0.14 0.015 245 | 0.96 0.005 240 | Headers, body text |
| text-secondary | 0.30 0.012 245 | 0.82 0.008 240 | Descriptions, subtitles — significantly improved contrast |
| text-tertiary | 0.46 0.008 245 | 0.68 0.006 240 | Labels, supporting text — strengthened readability |
| text-muted | 0.58 0.006 240 | 0.55 0.004 240 | Secondary content, metadata |

### Accent Colors (Vibrant & Persistent — Chroma Boosted 0.25–0.28)
| Accent | Light | Dark | Purpose | Hue Persistence |
|--------|-------|------|---------|------------------|
| accent-teal | 0.65 0.26 185 | 0.72 0.26 185 | Patient role, healthcare calm | Locked 185° |
| accent-amber | 0.72 0.26 75 | 0.78 0.26 75 | Pharmacy logistics, operational process | Locked 75° |
| accent-cyan | 0.68 0.24 200 | 0.75 0.24 200 | Technical active states, precision focus | Locked 200° |
| accent-indigo | 0.48 0.28 265 | 0.62 0.28 265 | Blueprint primary, command hierarchy | Locked 265° |
| accent-crimson | 0.52 0.28 15 | 0.62 0.28 15 | Admin authority, critical alerts | Locked 15° |

### Role Accent Colors (Vibrant Identity — Hue Locked, Chroma 0.22–0.28, Lightness Adapted Per Theme)
| Role | Light | Dark | Surface Tint | Usage |
|------|-------|------|--------------|-------|
| **Patient** | 0.65 0.22 185 | 0.74 0.26 185 | 0.94 0.05 185 | Vibrant healthcare teal on icons, metrics, badges, left-borders |
| **Pharmacy** | 0.72 0.22 75 | 0.80 0.25 75 | 0.94 0.05 75 | Vibrant amber on process workflows, inventory panels |
| **Hospital** | 0.58 0.24 245 | 0.70 0.27 245 | 0.93 0.06 245 | Vibrant clinical blue on precise records, monitoring |
| **Diagnostic** | 0.58 0.26 295 | 0.72 0.28 295 | 0.93 0.06 295 | Vibrant biotech purple on lab/analysis workflows |
| **Admin** | 0.52 0.26 15 | 0.66 0.28 15 | 0.92 0.06 15 | Vibrant command crimson on system oversight, critical controls |

### Border System (Strengthened for Panel Definition)
| Tier | Light | Dark | Purpose |
|------|-------|------|----------|
| border-base | 0.72 0.008 245 / 0.7 | 0.32 0.010 245 / 0.6 | Card edges, container dividers — visible separation |
| border-muted | 0.88 0.010 242 | 0.22 0.016 250 | Subtle section separators |
| border-strong | 0.58 0.010 245 / 0.9 | 0.45 0.012 245 / 0.8 | Interactive borders, strong panel definition |
| border-subtle | 0.82 0.005 245 / 0.5 | 0.22 0.008 245 / 0.4 | Table rows, faint dividers |
| border-focus | 0.68 0.18 200 | 0.75 0.18 200 | Focus rings, active indicator |

## Typography
| Role | Font | Scale | Weight | Letter-spacing |
|------|------|-------|--------|----------------|
| Display | Space Grotesk | 24–48px | 700 | -0.01em |
| Body | DM Sans | 14–16px | 400–500 | normal |
| Mono | JetBrains Mono | 12–14px | 500 | normal |
| Data | Tabular-nums | 14px | 500 | 0 |

## Elevation System (5 Tiers)
| Level | Light Shadow | Dark Shadow | Usage |
|-------|---|---|-------|
| 0 | None | None | Base surfaces |
| 1 | 0 1px 3px rgba(...,0.08) | 0 1px 3px rgba(...,0.35) | Subtle card depth |
| 2 | 0 4px 6px rgba(...,0.10) | 0 4px 6px rgba(...,0.42) | Layered panels |
| 3 | 0 10px 15px rgba(...,0.12) | 0 10px 15px rgba(...,0.50) | Prominent cards |
| 4 | 0 12px 32px oklch(0 0 0/0.15) | 0 12px 32px oklch(0 0 0/0.45) | Modals, dialogs |
| 5 | 0 16px 48px oklch(0 0 0/0.18) | 0 16px 48px oklch(0 0 0/0.50) | Top-layer overlays |

## Panel Depth Utilities
| Class | Background | Border | Shadow | Usage |
|-------|------------|--------|--------|-------|
| .panel-depth-1 | bg-surface | border-subtle | none | Recessed containers |
| .panel-depth-2 | bg-elevated | border-base | shadow-sm | Standard cards |
| .panel-depth-3 | bg-card | border-strong | shadow-base | Prominent panels |
| .panel-focus | bg-active | border-focus | — | Active/focused state |

## Metric Utilities (NEW)
| Class | Purpose | Example |
|-------|---------|----------|
| .metric-value-primary | Large bold metric numbers (2rem, 700 weight) | KPI cards, primary stats |
| .metric-label | Uppercase metric label (0.75rem, 500 weight, +0.08em spacing) | Metric context labels |
| .metric-delta-positive | Green success indicator (0.8rem, 600 weight) | +5% trend badges |
| .metric-delta-negative | Red danger indicator (0.8rem, 600 weight) | -3% trend badges |

## Component Patterns
**.card-operational**: Enterprise panel with role-specific left border (3px), operational shadow, subtle elevation. Status rail communicates context at a glance.
**.card-clinical**: Sharp corners, top border highlight (brand-primary opacity), dense data focus. Designed for information density and quick scanning.
**.panel-blueprint**: Muted sunken background, border-base, process/workflow card. Supports modular architectural visualization.
**.card-analytics**: Analytics container with bg-sunken, 1px brand-primary border (0.12 opacity), shadow-md elevation. For chart/metric containers.
**.timeline-node**: Circular brand-primary nodes connected via operational connector. Sequential lifecycle visualization with audit clarity.
**.section-alt**: Slightly different bg for alternating sections (bg-sunken tone) for visual rhythm.
**.metric-emphasis**: Stronger text treatment (text-primary, 600 weight) for key metrics.

## Role-Specific Utilities
**.role-[role]**: Vibrant color token for headers, text (patient, pharmacy, hospital, diagnostic, admin).
**.role-[role]-bg**: Colored surface tint with matching border and 3px left accent bar.
**.metric-[role]**: Emphasized metric text in role color (700 weight, 2rem size).
**.panel-[role]**: Panel with 3px left border in role color, operational hierarchy.

## Role-Specific Atmospheres
**Patient**: Vibrant teal (0.65/0.74 0.22/0.26 185) for healthcare peace of mind, softer interactions, personal healthcare focus, reminders, adherence tracking.
**Pharmacy**: Vibrant amber (0.72/0.80 0.22/0.25 75) for inventory/logistics processes, workflow clarity, supply tracking, fulfillment operations.
**Hospital**: Vibrant clinical blue (0.58/0.70 0.24/0.27 245) for precision, dense records, monitoring, structured data, patient workflows, clinical dashboards.
**Diagnostic**: Vibrant biotech purple (0.58/0.72 0.26/0.28 295) for laboratory analysis, technical proficiency, test workflows, analysis dashboards.
**Admin**: Vibrant command crimson (0.52/0.66 0.26/0.28 15) for system oversight, user management, critical controls, compliance.

## Accent Color Application Rules (CRITICAL)
**Backgrounds stay restrained & matte** — Never color large background areas heavily with accent colors. Use surfaces from the 4-tier hierarchy only.
**Use vibrant accent colors strategically on:**
- Icon fills and strokes (high chroma 0.26–0.28 values)
- Metric emphasis (bold, role-colored values)
- Active interaction states
- Chart highlights and data series
- Panel left-border status rails (3px, role color)
- Timeline nodes and connectors
- Navigation active states
- Badge backgrounds (role color)
- Alert borders and accents (role color)
- Dashboard focal points and KPIs

**Surfaces remain professional** — Subtle role-colored surface tints (5–6% opacity) may be used behind text in role-specific panels, but primary backgrounds stay from the neutral 4-tier hierarchy.

## Glassmorphism
| Property | Light | Dark | Purpose |
|----------|-------|------|----------|
| Blur | 8–12px | 20–24px | Soft transparency in light, atmospheric in dark |
| Opacity | 8–10% | 8% | Subtle overlay effect |
| Border opacity | 8–12% | 12–15% | Structural definition |
| Glow | Minimal | Restrained radial | No neon, controlled depth |

## Motion & Transitions
**Duration**: 200ms base, 100ms fast, 300–400ms slow for complex state changes.
**Easing**: cubic-bezier(0.4, 0, 0.2, 1) operational smoothness — no bounce, no spring physics.
**Entrance**: Fade-in-up on route load, sequential timeline reveals, controlled 2px lift on hover.
**State**: Smooth color transitions, elevation changes on interaction, clinical precision feel.

## Background & Patterns
**.bg-grid-technical**: SVG fine grid overlay, operational precision aesthetic.
**.bg-blueprint**: Dotted pattern, blueprint-inspired grid structure.
**Dark mode ambient**: Restrained radial gradients — brand-primary 0.08 opacity (top-right), accent-teal 0.06 opacity (bottom-left), brand-secondary 0.04 opacity (centered). Atmospheric depth without excessive glow.
**Light mode structure**: Layered cool-gray surfaces via --gradient-surface and --gradient-section-fade.

## Accessibility & Constraints
- WCAG AA+ contrast verified in both themes — text-secondary improved to 0.30/0.82 for excellent readability
- Touch targets: minimum 48px (healthcare-grade)
- No warm colors — cool professional gray baseline only
- All colors via semantic OKLCH tokens only, never hardcoded hex/rgb
- Role colors have persistent vibrant hue identity (chroma 0.22–0.28) — lightness adapts per theme
- Glassmorphism: card overlays only, not full-page effects
- Dark mode: atmospheric but restrained, operational utility colors used on focal points only
- Light mode: clean, readable, soft elevation through shadow and surface tones

## Signature Details
**Timeline/Lifecycle Visualization**: Process flows with connected operational nodes, status-rail cards, audit trail clarity. Vibrant role colors highlight operational state. Replaces generic AI dashboards with real healthcare infrastructure aesthetic.
**Medical Data Tables**: Tabular figures, dense rows, vertical rhythm for clinical readability. Lab reports and audit logs feel authoritative with improved text contrast.
**Operational Panels**: Modular blueprint-style containers (bg-base/surface/elevated tiers, vibrant borders) supporting workflow visualization, pharmaceutical lifecycle tracking, hospital network operations. 3px role-color left borders signal operational context.
**Role Accent Vibrancy**: Patient teal, Pharmacy amber, Hospital blue, Diagnostic purple, Admin crimson remain vibrant and recognizable across dark and light themes. Chroma boosted to 0.22–0.28. Hue identity never changes — only lightness and saturation adapt per theme.
**Atmospheric Depth**: Dark mode features restrained elevation tiers, modest ambient gradients, and operational panel layering (0.07→0.19 range). Light mode uses layered cool-gray surfaces (0.91→1.0 range) and refined shadow system. Professional, intelligent, and visually alive without visual noise.
