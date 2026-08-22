# After D1 closes — the edits that become true

Do these ONLY once `data/incidents.json` carries a fourth incident with `resolved: true`.
Until then every one of them is a claim about the future.

| Where | From | To |
|---|---|---|
| SUBMISSION §req-4 table | three rows | add `inc_004` BODEGA, opened **by the cron**, no human in any phase |
| SUBMISSION:72 | "Three heals, three incidents" | "Four heals, four incidents" |
| VIDEO-SCRIPT:16,43,192,213,230,238 | "three incidents" / "two of our three" | "four incidents" / "two of our four" |
| README "It already caught a real one" | three-incident table | fourth row |
| README wild note text | unchanged — still 2 wild of 4 | verify the live note says "2 of these breaks" |
| LINKEDIN-POST | "Three times" | "Four times, and the fourth had no human in it at all" |

The fourth is the strongest one to narrate, because it is the only incident where **no
phase was touched by a person**: the break was committed, and detection, diagnosis,
re-weave, verification and closure all happened on the cron's schedule while nobody
watched. Say that plainly and let the receipt prove it:
`node tools/evidence-report.js inc_004`.
