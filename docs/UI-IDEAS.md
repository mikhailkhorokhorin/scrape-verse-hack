# UI ideas

Running list for the Suit-Up (Best UI) push. Add freely; nothing here is committed to
until it moves into `PROGRESS.md`.

Format: what it is, why it helps the prize, rough cost. Cost is honest — a "small" that
turns out to be a day gets re-labelled, not quietly attempted.

---

## The problem to solve first

**The console is entirely green, so the best part of the design is invisible.**

Three Spiders, all 100%. No symbiote, no glitch, no critical panel, no infected chip. A
judge opening the live URL sees a healthy fleet and a legend describing states they never
witness. Everything we built the art direction around — the black climbing a panel,
covering exactly what was lost — is currently unreachable from the front page.

Every idea below is ranked against that.

---

## Strong

### 1. Let the judge see it break
Nothing beats this. Options, cheapest first:

- **`?state=critical` on the live URL.** Loads recorded history from a past incident
  instead of the present. Not a mock — real data from a real incident, just not the
  latest. One line in the loader, honest, and reversible.
- **A "show me a break" control in the legend.** The legend already explains the states;
  let it demonstrate them. Hovering a state in the legend previews it on a real panel.
- **T-12 itself.** The autonomous break puts a genuinely critical BODEGA on screen for an
  hour or two. Best evidence, but it is a window, not a permanent state — and the judge
  may look outside it.

Best combination: run T-12 **and** ship `?state=` so the break is reachable afterwards.

Cost: small. Impact: decides the prize.

### 2. Live polling
Re-read `data/*.json` every 30s. If a scan lands while the judge is on the page, the
console moves on its own — the pulse advances, the timestamp updates, a panel changes.

Turns a screenshot into a live instrument. We keep declining this one; it is still the
best ratio on the board after idea 1.

Cost: small.

### 3. History scrubber
A drag handle across the top spanning all recorded time. Pull it back and the whole
console — panels, symbiote, haul, integrity — renders that moment. Release and it snaps
to now.

Makes the 48 hours of real history explorable instead of summarized, and it reaches every
past state including the broken ones, which also solves idea 1.

Cost: medium. The replay engine already models time; this generalizes it.

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
