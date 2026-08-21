# UI ideas

Running list for the Suit-Up (Best UI) push. Add freely; nothing here is committed to
until it moves into `PROGRESS.md`.

Format: what it is, why it helps the prize, rough cost. Cost is honest — a "small" that
turns out to be a day gets re-labelled, not quietly attempted.

---

## Correction to an earlier reading

An earlier version of this file claimed the broken states were unreachable. That was
wrong, and the correction changes what needs building:

- **`?mock=1` already works.** Title becomes `[MOCK] THWIP Watch`, a pink warning band
  appears, BODEGA sits at 63% with the symbiote climbing its panel, and the break/heal
  controls mount. Honestly labelled.
- **Incident Replay on the front page runs on real data** — `inc_003`, BODEGA at 0%,
  `SNAP!`, all four fields dead, the four stages, the blast radius.
- **The incident feed** carries three real cards with strain badges.

So the states exist and are honest. The actual problem is narrower:

**The first screen is all green, and the strongest thing in the design lives below the
fold and behind a URL parameter nobody knows about.**

A Best UI judge decides in five seconds. Right now those five seconds show three healthy
panels and a legend describing states that are not on screen.

---

## DECIDED — the opening sequence

**On first load, the console demonstrates its own mechanic before settling into the
present.** Roughly six seconds, on real recorded data, then the page is exactly what a
plain load would have shown.

### The sequence

Driven by `inc_003` — BODEGA, a real incident that went 0% and recovered.

| Time | What happens |
|---|---|
| 0.0s | Panel healthy, 100%, clean. Holds long enough to register as the normal state |
| 0.8s | Integrity drops hard, `SNAP!` fires, fields start striking through |
| 1.6s | The symbiote climbs. `CRACK!`. Panel desaturates, chromatic offset goes hard |
| 2.6s | Holds at the bottom. This is the beat that has to land — the judge needs a moment to read the black as *loss* |
| 3.4s | `WEAVE...`, cyan pulse on the border, stages tick |
| 4.6s | `PURGE!` — the substance retracts downward, faster than it crept |
| 5.4s | `THWIP!`, colour floods back, integrity overshoots and settles |
| 6.0s | Dissolves into the live console at its real current state |

The hold at 2.6s matters more than the motion around it. Infection has to feel slow and
removal violent — that asymmetry is the whole emotional argument of the product.

### When it plays

| Situation | Behaviour |
|---|---|
| First visit in a tab | Plays |
| `cmd+R` | Does not play — `sessionStorage` remembers |
| New tab, or a different judge | Plays |
| `REPLAY INTRO` button in the masthead | Plays on demand |
| `?intro=1` | Forces it, ignoring `sessionStorage` |
| `prefers-reduced-motion: reduce` | Skipped entirely, straight to the live state |

`sessionStorage`, not `localStorage`: one play per tab is the right grain. A judge who
reloads should not sit through it twice; a judge who opens it fresh tomorrow should see it.

**Note on hard refresh:** `cmd+shift+R` clears the resource cache but not Web Storage, and
JavaScript cannot distinguish it from an ordinary reload — `navigation.type` reads
`"reload"` for both. The button and `?intro=1` cover that need instead.

### Non-negotiable constraints

- **Real data only.** Every value shown during the sequence comes from `inc_003`. No
  invented panel, no illustrative numbers. On a project about data honesty a fabricated
  hero is a failure of the argument, however well it renders
- **Skippable at any point** — any click, key or scroll jumps to the end state
- **Never blocks interaction.** The page stays usable throughout; skipping mid-sequence
  must leave nothing half-animated
- **Always ends in exactly the state a plain load produces.** If the two ever differ,
  that is a bug, not a flourish
- The `REPLAY INTRO` button is not hidden. A feature that cannot be repeated is a feature
  the judge saw once and could not verify

### Why this over the alternatives

Two other openings were considered and are still worth having if time allows:

- **Diptych** — a healthy panel and an infected one side by side above the grid, both from
  real history. Cheaper, static, teaches the visual language in two seconds
- **Evidence line** — `3 collectors · 4 incidents healed · 698 rows · 528 tests · c_a628…`
  in the masthead. Cheapest of the three, and the only one that addresses the fact that
  the first screen currently carries no proof at all

The sequence wins because it is also the video's cold open, and because it shows the
mechanic rather than describing it.

---

## Worth doing

### 4. Phone pass
A judge may well open the live URL on a phone. Nobody has checked what the pulse, the
heatmap, or THE HAUL do at 375px. Cheap to verify, embarrassing to lose on.

### 5. Deep link to an incident
`#inc_003` opens with that replay ready. The README and the video both want to point at
one specific case; without it we describe it in prose.

### 6. Keyboard path
Tab through panels, Enter opens the sheet, Escape closes, arrows step the replay. Also
the accessible path, so it counts twice.

### 7. First-load reveal
Sparklines draw, panels stagger in, the pulse traces once. Skippable, once per session.
Was cut earlier for time; the first five seconds are what Suit-Up is judged on.

---

## Speculative

### 8. Side-by-side Spiders
Compare two collectors on one axis — whose fields fail more, who recovers faster.

### 9. The page reacts to fleet health
Ambient: the ground shifts as fleet integrity drops, so the whole page feels the state
rather than just the panels.

### 10. Print / PDF view
A one-page incident report. Probably nobody prints it, but it is a distinctive artifact.

---

## Rejected, with reasons

- **Sound.** Autoplay is blocked, and audio during judging hurts more than it helps.
- **Threads between infected Spiders.** Would look good and would be a lie — the
  collectors are unrelated and no correlation exists.
- **Dark/light toggle.** The design deliberately commits to one world. A light mode would
  weaken it, not broaden it.
- **Rewriting the console.** Two days out, finished beats better.
