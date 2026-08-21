# THWIP — Design Specification

**This document is a contract, not a mood board.** We are competing for the Suit-Up
(Best UI) track. The single largest risk to that prize is that an AI coding agent
defaults to a generic dark dashboard — rounded slate cards, Inter, blue accents, soft
shadows. Two hundred other submissions will look like that. Values below are literal.
Use them as written.

Read the **Banned** section before writing a single line of CSS.

---

## 1. Art direction

Spider-Verse comic page. Printed, screen-printed, slightly misregistered. The console
is a comic page that happens to display live telemetry.

Four principles:

1. **Ink over glow.** Weight comes from thick black borders and hard offset shadows,
   never from blur or glassmorphism.
2. **Misregistration is intentional.** Cheap comic printing separated the color plates.
   Chromatic offset is the signature and it doubles as our damage signal.
3. **Halftone is the texture of every surface.** Flat fills read as web UI. Dotted fills
   read as print.
4. **Damage is loud.** When a Spider takes damage the page reacts — shake, burst,
   desaturation. Health changes are events, not silent number updates.

---

## 2. Color

```css
:root {
  /* Ink and paper */
  --ink:        #0B0A10;  /* borders, hard shadows, body text on light */
  --paper:      #F4EFE4;  /* aged newsprint, light surfaces */
  --paper-dot:  #DED5C2;  /* halftone dots over paper */

  /* Field (dark surfaces) */
  --void:       #14061F;  /* page background */
  --void-2:     #1F0A2E;  /* raised panel background */
  --void-dot:   #2C1140;  /* halftone dots over void */

  /* Comic accents */
  --pink:       #FF2E88;  /* primary accent, chromatic left plate */
  --cyan:       #00E5FF;  /* secondary accent, chromatic right plate */
  --purple:     #6C2BD9;  /* mid field, dividers */

  /* Health semantics */
  --healthy:    #B6FF3C;  /* Integrity >= 90 */
  --degraded:   #FFB800;  /* Integrity 60-89 */
  --critical:   #FF1E1E;  /* Integrity < 60 */
  --reweaving:  #00E5FF;  /* healing in progress */

  /* Symbiote */
  --symbiote:      #050408;  /* the substance — deeper than --ink */
  --symbiote-edge: #3B0D57;  /* violet bloom at the spreading edge */
  --infected:      #C24BFF;  /* a field that returned a wrong value */
  --unwatched:     #2A2438;  /* nobody is looking at this Spider */
}
```

Page background is `--void`. Panels sit on it. Accents are saturated and used at full
strength — no 10% opacity tints, no muted pastels.

Health colors are the only semantic colors. Never use `--healthy` as a decorative green
or `--critical` as a decorative red. If it is that color, it means that state.

### Contrast

Body and data text must hit WCAG AA (4.5:1). `--healthy`, `--degraded`, `--cyan` on
`--void` all pass. `--pink` on `--void` is 4.9:1 and passes for body; `--critical` on
`--void` is 4.2:1 — use it for fills, bars, and large type only, never small body text.

---

## 3. Typography

Google Fonts only.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Bangers&family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
```

| Role | Face | Usage |
|---|---|---|
| Display | **Anton** | Masthead, Spider codenames, section headers. Always uppercase, `letter-spacing: 0.02em` |
| Sound FX | **Bangers** | Onomatopoeia bursts only (`THWIP!`, `CRACK!`, `SNAP!`). Never for UI labels |
| Body / UI | **Space Grotesk** | Labels, descriptions, buttons, feed copy |
| Data | **IBM Plex Mono** | All numbers, timestamps, field names, Collector IDs, JSON |

Every number on the console is monospace. Integrity percentages, timestamps, run counts.
Tabular figures stop the layout jittering when values change.

### Scale

```css
--t-masthead: clamp(2.5rem, 6vw, 5rem);   /* Anton */
--t-codename: clamp(1.5rem, 3vw, 2.25rem);/* Anton */
--t-section:  1.25rem;                     /* Anton */
--t-body:     0.9375rem;                   /* Space Grotesk */
--t-label:    0.75rem;                     /* Space Grotesk, uppercase, 0.08em tracking */
--t-data-xl:  clamp(2rem, 4vw, 3rem);      /* IBM Plex Mono, integrity readout */
--t-data:     0.875rem;                    /* IBM Plex Mono */
```

---

## 4. Signature effects

These five recipes are the entire visual identity. Use them verbatim.

### 4.1 Halftone overlay

Every large surface carries it. Apply as a pseudo-element so it does not affect content.

```css
.halftone::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(var(--void-dot) 1px, transparent 1.4px);
  background-size: 4px 4px;
  opacity: 0.55;
}
```

On light surfaces swap the dot color to `--paper-dot` and raise `background-size` to
`5px 5px`.

### 4.2 Chromatic aberration

The damage signal. Intensity is bound to state, so it doubles as a data encoding.

```css
.chroma      { text-shadow: 1px 0 var(--pink), -1px 0 var(--cyan); }   /* healthy, subtle */
.chroma-mid  { text-shadow: 2px 0 var(--pink), -2px 0 var(--cyan); }   /* degraded */
.chroma-hard { text-shadow: 4px 0 var(--pink), -4px 0 var(--cyan); }   /* critical */
```

### 4.3 Comic panel

Hard borders, hard shadow, zero blur. This is what makes it a comic and not a card.

```css
.panel {
  position: relative;
  background: var(--void-2);
  border: 3px solid var(--ink);
  border-radius: 2px;                    /* effectively sharp */
  box-shadow: 6px 6px 0 var(--ink);      /* NO blur radius, ever */
}
.panel--tilt-a { transform: rotate(-0.6deg); }
.panel--tilt-b { transform: rotate(0.4deg);  }
```

Alternate `--tilt-a` and `--tilt-b` across the grid so the page reads as hand-laid comic
panels rather than a CSS grid. Keep tilt under 1deg — more looks broken, not styled.

### 4.4 Glitch

Applied to a Spider panel in `CRITICAL`.

```css
@keyframes glitch-slice {
  0%, 87%, 100% { clip-path: inset(0 0 0 0);     transform: translate(0); }
  89%           { clip-path: inset(18% 0 62% 0); transform: translate(-5px); }
  92%           { clip-path: inset(54% 0 26% 0); transform: translate(5px); }
  95%           { clip-path: inset(36% 0 44% 0); transform: translate(-3px); }
  98%           { clip-path: inset(72% 0 12% 0); transform: translate(3px); }
}
.is-critical { animation: glitch-slice 3.2s steps(1) infinite; filter: saturate(0.45); }
.is-degraded { animation: glitch-slice 7s   steps(1) infinite; filter: saturate(0.82); }
```

`steps(1)` matters — glitches snap, they do not ease.

Two things this spec got wrong on the first pass, both found in the prototype:

**Keep the clean state on screen for most of the cycle.** Spreading the keyframes evenly
leaves the panel clipped roughly 80% of the time, which reads as broken layout rather
than as a glitch. The break belongs in the last ~13% of the loop.

**Panel tilt needs its own element.** `transform` here overwrites the `rotate()` that
creates the comic tilt, so the grid silently flattens. Put the tilt on a wrapper `.cell`
and animate the `.panel` inside it.

### 4.5 Onomatopoeia burst

Fires on state transitions. Absolutely positioned over the panel.

```css
.burst {
  font-family: "Bangers", cursive;
  font-size: clamp(2rem, 5vw, 3.5rem);
  color: var(--healthy);
  -webkit-text-stroke: 3px var(--ink);
  paint-order: stroke fill;
  transform: rotate(-8deg);
  animation: burst-in 400ms cubic-bezier(0.34, 1.8, 0.64, 1) both,
             burst-out 600ms ease-in 900ms both;
}
@keyframes burst-in  { from { transform: rotate(-8deg) scale(0.5); opacity: 0; } }
@keyframes burst-out { to   { transform: rotate(-8deg) scale(1.25); opacity: 0; } }
```

Vocabulary — do not invent others:

| Event | Word | Color |
|---|---|---|
| Integrity drops below 60 | `CRACK!` | `--critical` |
| Fields go null | `SNAP!` | `--degraded` |
| Re-weave starts | `WEAVE...` | `--cyan` |
| Symbiote takes ground | `CREEP...` | `--infected` |
| Symbiote is torn free | `PURGE!` | `--cyan` |
| Recovery to healthy | `THWIP!` | `--healthy` |

`CREEP...` and `PURGE!` are deliberately generic. See section 4.6 on keeping the
symbiote unnamed.

### 4.6 Symbiote spread

**This is the primary health signal on the console.** The Integrity bar is secondary
confirmation; the spread is what a judge reads first.

A scraper that breaks does not crash. It keeps running, keeps returning rows, and the
rows are quietly wrong. Something got inside and changed its behavior while it kept
looking fine from the outside. That is what the spread depicts: a black substance
creeping up the panel from the bottom, covering exactly as much of it as the Spider has
lost.

```
Integrity 100  ->  spread 0.00   clean panel
Integrity  72  ->  spread 0.28   substance pooling along the bottom edge
Integrity  42  ->  spread 0.58   past halfway, tendrils reaching the codename
Integrity  15  ->  spread 0.85   panel nearly consumed
```

JS sets one custom property per panel; CSS does the rest:

```js
panel.style.setProperty('--spread', ((100 - integrity) / 100).toFixed(2));
```

**Two nested elements, not one.** CSS applies `filter` *before* `mask`, so a filter and
a mask on the same element produce a smooth-edged gradient — the displacement runs on a
flat rectangle and then gets clipped away. The mask must go on an inner element and the
displacement on the wrapper around it:

```html
<div class="symbiote"><div class="symbiote__body"></div></div>
```

```css
.symbiote {
  position: absolute;
  inset: -6px;                 /* overhang, so the torn edge is not cropped */
  z-index: 1;
  pointer-events: none;
  filter: url(#symbiote-turbulence) drop-shadow(0 0 11px var(--symbiote-edge));
}

.symbiote__body {
  position: absolute;
  inset: 0;
  background: var(--symbiote);
  -webkit-mask-image: radial-gradient(125% 96% at 50% 108%,
    #000 calc(var(--spread) * 82%),
    transparent calc(var(--spread) * 82% + 13%));
  mask-image: radial-gradient(125% 96% at 50% 108%,
    #000 calc(var(--spread) * 82%),
    transparent calc(var(--spread) * 82% + 13%));
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  transition: -webkit-mask-image 800ms cubic-bezier(0.22, 1, 0.36, 1),
              mask-image 800ms cubic-bezier(0.22, 1, 0.36, 1);
  animation: symbiote-breathe 9s ease-in-out infinite;
}

@keyframes symbiote-breathe {
  0%, 100% { mask-position: 0 0;     -webkit-mask-position: 0 0;     }
  50%      { mask-position: 0 -2.5%; -webkit-mask-position: 0 -2.5%; }
}
```

At `--spread: 0` the gradient still paints a small dark pool at the origin, so a healthy
Spider picks up a bruise it has not earned. Do not render the element at all below
`0.03` — omit it in the template rather than fading it with opacity.

The torn, organic edge comes from an SVG filter. Define it once, inline, hidden:

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="symbiote-turbulence">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.022"
                  numOctaves="3" seed="7" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="20"
                       xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
```

Without `feDisplacementMap` this is just a black gradient and the effect dies. The
ragged edge is the entire point — a flat gradient reads as a progress bar, a torn edge
reads as something alive.

Content above the spread must stay legible. Give panel content
`position: relative; z-index: 1` so it renders over the substance, and switch text to
`--paper` once spread exceeds `0.5`.

**On healing**, the spread retracts downward over 900ms with a `PURGE!` burst — faster
than it crept in. Infection should feel slow; removal should feel violent.

**Naming.** The substance is never named on screen and never given a character. In code
and copy it is only *the symbiote* or *the spread*. No Marvel character names, logos, or
likenesses. "Symbiote" is a generic biological term and is safe; character names are not.

### 4.7 Unwatched

A Spider whose last scan is older than 3 hours has nobody looking at it. It recedes into
the dark — the cost of going unobserved, shown rather than stated.

```css
.is-unwatched {
  opacity: 0.32;
  filter: grayscale(1) brightness(0.65);
  border-color: var(--unwatched);
  box-shadow: none;              /* loses its hard shadow — falls back into the page */
  transition: opacity 1.2s ease, filter 1.2s ease;
}
```

Losing the offset shadow is what sells it: the panel stops standing off the page and
sinks into the background along with everything else nobody is watching.

---

## 5. Spider panel anatomy

Top to bottom, fixed order. Every panel is identical in structure so the grid scans.

```
┌─────────────────────────────────────┐  3px ink border, 6px hard shadow
│ ▓▓ BODEGA          [ ● CRITICAL ]  │  Anton codename + status badge
│ ░░ niche-market.example             │  IBM Plex Mono, --purple
│                                     │
│              42%                    │  --t-data-xl, colored by state
│         INTEGRITY                   │  --t-label
│                                     │
│  ▁▂▄▆█▇▅▃▁▁▂▁                       │  24h sparkline, 2px stroke
│                                     │
│  ████████░░░░░░░░░░░░               │  Integrity bar, 14px, ink border
│                                     │
│  title ✓   price ⚠   rating ✗       │  field chips — three states
│  image ✓                            │
│                                     │
│  LAST SCAN  12:04:18Z               │  --t-label + mono
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  symbiote spread, rising from the base
└─────────────────────────────────────┘
```

The field chip row is the most important element for credibility. It is the thing that
turns a health bar into a diagnosis. Do not cut it for space.

### Field chips — three states

| Chip | Meaning | Style |
|---|---|---|
| `✓` **LIVE** | value present and passes validation | `--healthy`, normal weight |
| `⚠` **INFECTED** | value present but wrong — price parsing as text, rating out of range, title containing `undefined` | `--infected`, slow 2s opacity pulse |
| `✗` **DEAD** | value is `null`, `""`, or `[]` | `--unwatched`, struck through |

`INFECTED` is the state that carries the whole idea. A dead field is obvious — every null
check in the world catches it. An infected field passes null checks and flows straight
into the pipeline carrying a wrong value. It is the failure nobody instruments, and
showing it is what separates this console from a status page.

Infected chips pulse. Dead chips do not — dead is static, infection is alive.

### Integrity bar

```css
.bar {
  height: 14px;
  border: 2px solid var(--ink);
  background: var(--void);
  overflow: hidden;
}
.bar__fill {
  height: 100%;
  background: var(--healthy);       /* swapped by state */
  transition: width 600ms cubic-bezier(0.22, 1, 0.36, 1),
              background-color 300ms linear;
}
```

On recovery the fill overshoots to `+4%` then settles — a spring, not a slide. Damage
does not overshoot; it drops hard and fast (`180ms ease-in`).

---

## 6. Motion

| Event | Duration | Easing | Notes |
|---|---|---|---|
| Panel entrance | 400ms | `cubic-bezier(0.22,1,0.36,1)` | Stagger 60ms, `translateY(14px)` + fade |
| Damage hit | 220ms | `ease-in` | Shake ±5px, red flash, chroma spike to hard |
| Integrity drop | 180ms | `ease-in` | Fast, no overshoot |
| Integrity recover | 600ms | `cubic-bezier(0.34,1.6,0.64,1)` | Overshoot then settle |
| Re-weave pulse | 1200ms | `ease-in-out` | Infinite, cyan glow on border |
| Burst | 400ms in / 600ms out | spring / `ease-in` | 900ms hold between |
| Feed item arrival | 350ms | `cubic-bezier(0.22,1,0.36,1)` | Slide from left, newest on top |
| Symbiote creep | 800ms | `cubic-bezier(0.22,1,0.36,1)` | Mask grows, never linear |
| Symbiote purge | 900ms | `ease-out` | Retracts downward, `PURGE!` burst |
| Symbiote breathe | 9000ms | `ease-in-out` | Infinite, ±2.5% mask drift |
| Infected chip pulse | 2000ms | `ease-in-out` | Infinite, opacity 1 → 0.45 |
| Fade to unwatched | 1200ms | `ease` | Loses hard shadow, sinks into the page |

Idle is not static. Healthy panels breathe — a 4s `scale(1) -> scale(1.004)` loop. A
completely still dashboard reads as a screenshot in a video.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

State must remain readable with all motion off — glitch states keep their desaturation
and chroma offset as static styles. Judges may view with reduced motion enabled.

---

## 7. Layout

- Max content width `1440px`, centered, `32px` gutters (`16px` under 768px)
- Spider grid: 3 columns >= 1200px, 2 columns 768-1199px, 1 column < 768px
- Grid gap: `26px` column, `22px` row — panels need air, their offset shadows must not collide

### Panel size is data

**Equal frames are the thing to avoid.** A 3×N grid of identical cards is the single most
recognizable dashboard layout there is, and comic styling laid over it reads as a skin.
A real comic page varies its frames, and the large panel is the dramatic one.

So size encodes state:

| State | Cell size | Contents |
|---|---|---|
| `CRITICAL`, `REWEAVING` | 2 cols × 2 rows | Everything |
| `DEGRADED` | 1 col × 2 rows | Everything |
| `HEALTHY`, `UNWATCHED` | 1 col × 1 row | Compact: codename, badge, sparkline, bar, small percentage |

`grid-auto-rows: 168px` with `grid-auto-flow: dense`. Below 768px every panel collapses
to a single full-width row.

The consequence is that the reader never scans for the problem — a sick Spider physically
takes the page and healthy ones shrink to strips. The layout is the summary.

The compact panel drops the field chips and the large readout on purpose: no diagnosis is
needed when nothing is wrong. Detail is a reward for something being broken.
- Incident feed is full width below the grid, single column always, max item width `760px`
- Vertical rhythm on an 8px base

Responsive is required — a judge may open it on a phone. Tilt is disabled below 768px
(rotated panels waste horizontal space on narrow screens).

### The substance is not contained by a panel

Infection trapped inside each card makes the fleet read as three unrelated widgets. The
symbiote also pools on the page itself — fixed, behind and between the panels, driven by
average fleet Integrity.

Fleet health then needs no number: it is how much of the screen has gone black. The
readout in the masthead becomes confirmation rather than the source.

### Sound breaks the frame

Onomatopoeia overruns the panel border and lands on its neighbours. A burst that sits
politely inside its frame is what makes the page read as a grid of divs.

Two things silently defeat this and both must be avoided: `isolation: isolate` on the
panel creates a stacking context the burst cannot escape, and the `transform` that
produces the comic tilt creates another on the cell — so the cell has to be raised with
`z-index` for as long as the burst is on screen.

---

## 8. Banned

Any of these means the design has drifted to generic. Non-negotiable.

- ❌ `border-radius` above `4px` — comic panels are sharp
- ❌ Blurred or soft shadows — `box-shadow` blur radius is always `0`
- ❌ Tailwind default `slate` / `gray` / `zinc` palette
- ❌ Inter, Roboto, system-ui, or any default sans for display type
- ❌ Glassmorphism, `backdrop-filter: blur()`
- ❌ Gradients as primary surface fills — halftone is the texture
- ❌ Emoji used as icons
- ❌ Generic blue (`#3B82F6` and relatives) anywhere
- ❌ shadcn/ui, MUI, Chakra, Bootstrap, or any component library with an opinion
- ❌ Bar charts and line charts with default library styling — sparklines are hand-drawn
      SVG with ink borders and flat fills
- ❌ Skeleton loaders with shimmer — use halftone dissolve instead
- ❌ Placeholder or lorem content anywhere in the shipped build

---

### Diurnal ground

The page ground follows UTC: deeper and colder through the night, lighter through the
working day. Only `--void` and `--void-2` shift — no other token moves.

It carries the loneliness the product is about: the Spiders work while everyone sleeps.

Keep the range narrow and verify contrast at both extremes — 03:00 and 14:00 UTC — rather
than assuming the interpolation stays safe. Every text color must hold AA at each end.
Show the current UTC hour in the masthead so the shift reads as deliberate and not as a
rendering fault. Optional; the lowest-priority item in the backlog.

---

## 9. Reference prototype

`docs/prototype.html` — a working single-file implementation of THE WATCH with mock data.
Open it directly in a browser; no server or build step needed.

It is the visual source of truth. Where this document and the prototype disagree, the
prototype is right — it is the version that has actually been rendered. Its demo control
bar (break / re-weave / unwatched / reset) exists to exercise every state and does not
ship.

Match it, then replace the mock fleet with `fetch` against the real JSON.

---

## 10. Stack

- Single-page static site. **Vanilla HTML + CSS + JS**, no build step.
- Reads `data/history.json` and `data/incidents.json` via `fetch`.
- Sparklines and charts are hand-rolled inline SVG. No Chart.js, no D3, no Recharts.
- Deployed on GitLab Pages from the repo (`pages` job, `public/` directory).

No framework. A React toolchain buys nothing here and costs setup time we do not have,
and every component library pulls the design toward the banned list.

---

## 11. Acceptance

The console is done when all of these hold:

- [ ] A single screenshot of THE WATCH is legible and striking at 800px wide
- [ ] The five Spider states are distinguishable at 50% zoom with no text readable
- [ ] Nothing on screen matches anything in section 8
- [ ] All numbers are monospace and do not shift layout when they change
- [ ] Works at 375px, 768px, and 1440px
- [ ] Fully readable and state-legible with `prefers-reduced-motion: reduce`
- [ ] Loads and renders in under 2 seconds on a cold cache
- [ ] Zero placeholder content — every value on screen comes from real run data
- [ ] Symbiote spread is visibly torn-edged, not a smooth gradient
- [ ] Panel content stays readable at `--spread: 0.85`
- [ ] Infected chips are distinguishable from both live and dead at a glance
- [ ] The symbiote is never named and no character likeness appears anywhere
