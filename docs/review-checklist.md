# Keeping the site alive: the review checklist

The rhythm in [docs/plan.md](plan.md), Phase 7, item by item. This file is
the one copy of its words. `.github/workflows/review.yml` opens a
"Quarterly review — YYYY Qn" issue on the first Monday of January, April,
July and October carrying everything from the first heading below, and
`tests/health.test.js` fails if the plan's Phase 7 table and these lines
say different things. Each item's words in bold are the plan's; what
follows them says how.

## Monthly

- [ ] **Publish one note.** One Field Note a month (owner checklist L2).
- [ ] **Read `stats.html`.** The open counts, rebuilt each Monday from the
  week before: which pages, role views and features are used, and the four
  numbers.
- [ ] **Answer every contact within two days.** Messages land in the
  sheet's Responses tab and in the `OWNER_EMAIL` inbox.

## Quarterly

- [ ] **Re-verify profile facts (`verifiedOn`).** Check that every fact in
  `content/profile.json` still holds, the role marked "Present" first; set
  `meta.verifiedOn` to the day, and `meta.confirmedOn`, which only Moses
  sets (owner checklist F5). Then `npm run build:content` and `npm run cv`,
  and commit the profile, the pages and the CV together.
- [ ] **Refresh AI data.** Reread the sources in `ai-carbon-data.js`, add
  the models that matter now, and move `REVIEWED_ON`;
  `tests/carbon.test.js` holds every entry to its source, range and review
  date.
- [ ] **Ratchet budgets down.** `npm run budget` ends with "you could lower
  X from A to B" wherever a ceiling has room: lower each one, then run
  `node scripts/check-budget.js --readme`.
- [ ] **Review the four numbers against the baseline.** `stats.html`
  against the four-week baseline in `docs/plan.md` ("Progress", Phase 1,
  step 5; owner checklist S6). A change that has not moved its number
  within a quarter is cut.

## Yearly

- [ ] **Publish the sustainability statement.** The site's own statement
  (`docs/plan.md`, Phase 4.2), from its measured data.
- [ ] **Regenerate the CV.** `npm run cv`, and commit
  `assets/Moses_Kolleh_Sesay_CV.pdf` with `assets/cv.hash`. The weekly
  health check says when `content/` has moved on since it was printed.
- [ ] **Review the lenses against the roles he is going for.**
  `content/lenses.json` against `atAGlance.targetRoles` in
  `content/profile.json`.
