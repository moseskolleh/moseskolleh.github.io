# What only Moses can do or supply

The single list of everything the site needs from Moses: facts only he can
state, evidence only he holds, and checks on accounts only he can open. It
grows from the "What only Moses can supply" table in [docs/plan.md](plan.md)
and from what each wave of work found. An item is
ticked only once it can be seen to be done: in the repository, on the live
site, or by Moses saying so. One item is ticked, S7, because the repository
shows it done; nothing else is yet.

Each item says what is needed, where it goes, what it unlocks, and how to
check it. A path such as `content/profile.json` → `experience[4].teamSize`
means that file, then that field (lists count from 0). After editing anything
in `content/`, run `npm run build:content` and then `npm test`.

Last updated with wave 6 of the plan, 2026-10-18. Waves 1 to 5 are on
`main` (pull requests #48 to #53): Phase 0, the narration steps of 2.5 and
4.3 (the narration has since been removed, and its two items with it),
Phase 1, Phase 2, Phase 3, The Brief (retired on 2026-10-28, and its
three items, S4, B1 and B2, with it), the notes as articles with a
feed and preview cards, structured data, the weekly health and quarterly
review issues, and Phase 6 steps 3, 6, 7 and 8. Wave 5's items are the
group headed "wave 5" below (H1, H2, L5). Wave 6 (lighter images,
a Content-Security-Policy, CSS hygiene, The Brief's review fixes, and the
move to the root of `moseskolleh.github.io`, which you began by renaming
the repository) is in its own pull request until it is merged; it adds
nothing for you to supply, and half of L3 is done.

**Start here.** Of the items below, these unlock the most, and take under
an hour together. Everything else can wait for them.

1. **C1, C2, C3** — prove the contact form works on the live site. Nobody
   has yet, and every page's visit counter posts to the same deployment.
   The 2025 versions of the script would record each page view as a
   message and email it to you; if the one-line check at the top of S1
   says the live script might be one of those, do C2 at once.
2. **S1, S2** — switch on the visit counts. Until then the open-counts job
   runs each Monday and finds nothing, the four-week baseline every later
   change is judged by (S6) cannot start, and the sustainability statement
   (Phase 4.2) has no data.
3. **F1, F2, F3** — your languages and Dutch level, right to work, target
   roles, seniority and available-from date. They are what a recruiter
   asks first. Until they are stated, the at-a-glance strip leaves them
   out.

Once a week the "Site health" issue on GitHub (from wave 5) lists which of
these are still open, beside anything on the site that has broken.

---

## Do first: prove the contact form works (Phase 0.9)

The repository can test `google-apps-script/Code.gs` against stand-ins
(`tests/apps-script.test.js`), but it cannot see the live Apps Script project,
its settings or its deployment. A form that fails silently is the most
expensive bug a portfolio can have, so do these three in order.

The site posts to this deployment, written in three places that must agree
(`npm test` fails if they do not): `GOOGLE_APPS_SCRIPT_URL` in `script.js`,
the contact form's `action` in `index.html`, and the visit counter's address
in `count.js`, which adds `?action=count`:

```
https://script.google.com/macros/s/AKfycbzgyqRUmu0d2UFjb0WxbYyoDbO8F9jVnlvIQnNAfMU0v8JFpH5KAefy4z9BNoQqd68/exec
```

- [ ] **C1. Confirm `SPREADSHEET_ID` and `OWNER_EMAIL` in Script Properties.**
  - *Where:* open the Apps Script project behind the form (from the response
    sheet: **Extensions → Apps Script**, or from
    [script.google.com](https://script.google.com)) → **Project Settings**
    (gear, left rail) → **Script Properties**.
  - *Check:* `SPREADSHEET_ID` equals the id in the response sheet's URL
    (`docs.google.com/spreadsheets/d/<id>/edit`), and `OWNER_EMAIL` is the
    inbox you read. `SHEET_NAME` is optional (default `Responses`). Leave
    `TURNSTILE_SECRET` unset: the site loads no Turnstile widget, so with it
    set every submission would be refused (and even with the widget, visitors
    without JavaScript could not send the form).
  - *Then:* in the editor, pick `testConfiguration` in the function menu and
    press **Run**. The execution log should say `Sheet: Responses (N rows)`
    (or the tab `SHEET_NAME` names) and `Configuration OK`. Anything else
    names what is missing.
  - *Unlocks:* submissions land in the right sheet and reach you by email.
    The visit counts (S1) go in the same spreadsheet, on a `Daily` tab the
    script creates, so the same `SPREADSHEET_ID` serves both. The counter
    needs one more property, `STATS_TOKEN`; S1 says how to make it.

- [ ] **C2. Redeploy the Apps Script as a new version, after #41 and #42,
  and now the visit counter.**
  - *Why:* PR #41 (merged 2026-09-02) added the JavaScript-free form path, and
    PR #42 (merged 2026-09-24) fixed it: before #42, every JavaScript-free
    submission was answered "Something went wrong" and "undefined", even when
    it had been recorded. Wave 2 (2026-09-27) added the visit counter's two
    actions, `?action=count` and `?action=stats`, to the same file. Editing
    code in the editor does not change the live endpoint; only a new
    deployment version does. One publish of the current file covers all
    three.
  - *When:* now: the counter has been on `main` since 2026-09-27 (see S1).
  - *Steps:*
    1. Open `google-apps-script/Code.gs` in this repository (last changed
       2026-09-27, when the visit counter was added), copy all of it, and
       paste it over the code in the editor. Save.
    2. **Deploy → Manage deployments** → select the active **Web app**
       deployment → **Edit** (pencil) → **Version: New version** → **Deploy**.
       Keep **Execute as: Me** and **Who has access: Anyone**.
    3. Still in **Manage deployments**, check that the deployment's Web app
       URL is exactly the one above. If it differs, the site is posting
       somewhere else: either use that deployment, or put its URL in
       `script.js`, `index.html` and `count.js` (there with `?action=count`
       after it).
  - *Check:* Manage deployments shows the active deployment at a new version
    dated today; the editor's `handleSubmission` contains
    `var reply = function (status, message)` (the #42 fix), and the file has a
    `function handleCount` (the counter). From outside,
    `curl -L "<the URL above>?action=health"` prints the version the
    deployment runs, `{"status":"ok","version":"…",…}`, and that version is
    the `CODE_VERSION` at the top of the repository's `Code.gs`. (Before
    wave 5 this said to try `?action=stats`, but without the token that
    answers `{"status":"refused",…}` from any current script, published or
    not.) The weekly Site health issue makes the same comparison and says
    whether it matches.
  - *Unlocks:* the no-JavaScript form, which wave 1 made reachable, tells the
    visitor the truth.

- [ ] **C3. Send one real message from the live site, and see it arrive.**
  - *With JavaScript (the normal path):* open
    <https://moseskolleh.github.io/#contact>, fill in the form
    with an address you can read other than `OWNER_EMAIL`, a subject such as
    "Live test 2026-09-26", and a short message. Press **Send Message**. The
    page should say "Thank you for your message! It has been sent".
  - *Without JavaScript:* wait at least 15 seconds (the form allows one
    message per address per 15 seconds, and 5 per hour), turn JavaScript off
    for the site (Chrome: DevTools → `Ctrl/Cmd+Shift+P` → "Disable
    JavaScript", then reload), and send a second message. The browser should
    land on a plain page titled "Message sent" that says "Thank you" and
    "Response recorded successfully!", with a link back. "Something went
    wrong" or "undefined" means C2 has not taken effect.
    - This needs wave 1 on the live site. It is on `main` (pull request
      #48); if the live homepage without JavaScript still shows only its
      loading screen, GitHub Pages has not rebuilt from `main` yet. To test
      the same server path without the page, post the form's fields the way
      the browser would:

      ```bash
      curl -L "https://script.google.com/macros/s/AKfycbzgyqRUmu0d2UFjb0WxbYyoDbO8F9jVnlvIQnNAfMU0v8JFpH5KAefy4z9BNoQqd68/exec" \
        --data-urlencode "name=Live test, no JavaScript" \
        --data-urlencode "email=you@example.com" \
        --data-urlencode "message=Testing the form path"
      ```

      It should print a page containing "Thank you" and "Response recorded
      successfully!". Use an address you can read, and not `-X POST`.
  - *Check:* two new rows in the sheet's `Responses` tab, or the tab
    `SHEET_NAME` names (Source "Portfolio Website" for the first, empty for
    the second, since the form itself sends no source), and two emails
    titled "New Submission from …" in the `OWNER_EMAIL` inbox. Once C2 has
    published the counter, the `Daily` tab's `contact` row for today counts
    them too (2, if nothing else was sent that day). Replying to
    one should address the visitor's email. If a row is missing, open
    **Executions** in the Apps Script editor; a failed request is logged
    there with its reason.
  - *Unlocks:* Phase 0 step 9 is done: the form is known to work, not
    assumed to.

---

## Switch on the visit counter and the open counts (Phase 1)

Wave 2 built a cookieless visit counter (`count.js`, on every page), its end
in `Code.gs` (`POST ?action=count` adds a page view to daily totals, and
`GET ?action=stats&token=...` serves them to the weekly Action alone), and
`stats.html` with a weekly Action that fills it. None of it counts anything
until S1 and S2 are done. What is sent, what never is, and why, is in the
README under "The visit counter and privacy".

- [ ] **S1. Give the script a `STATS_TOKEN`, publish the counter, then run
  `testCounter()` once.**
  - *First, now (wave 2 reached `main` on 2026-09-27):* find out how old the
    live script is. Run `curl -L "<the URL above>"` (or open that address in
    a browser). If the reply is an HTML page rather than one line of JSON
    (the old page says "Form Response Capture API" and names the
    spreadsheet), the live script is from before 2026-08-05, and may be one
    of the 2025 versions, which record any POST as a contact message and
    email it to you. With `count.js` on the live site, that is one row and
    one email per page view, so publish (below) at once. If it prints
    `{"status":"ok",...}`, the live script is from 2026-08-05 or later: it
    reads a count as a message with no name and refuses it, recording
    nothing, so no harm is done, and nothing is counted until you publish.
  - *The token:* the daily totals `?action=stats` serves are not suppressed,
    and the web app's address is in `count.js` on every page, so the script
    serves them only to a request carrying `&token=` set to the
    `STATS_TOKEN` script property, and to nobody at all while it is unset.
    `stats.html` promises that no count under 5 and no single day's count is
    ever published, and this is what keeps that true. Make one with
    `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`
    (or any long random string of letters, digits, `-` and `_`), and add it
    in **Project Settings → Script Properties** as `STATS_TOKEN`, beside
    `SPREADSHEET_ID` and `OWNER_EMAIL`. Keep it: S2 needs it, and it goes
    nowhere else.
  - *Where:* this is the same publish as C2: paste the current
    `google-apps-script/Code.gs`, then **Deploy → Manage deployments** →
    the active Web app deployment → **Edit** → **Version: New version** →
    **Deploy**. It must be a new version of the *existing* deployment, not a
    **New deployment**: that would get a new URL, and `script.js`,
    `index.html`, `count.js` and `STATS_SOURCE_URL` would all have to change.
  - *Then:* in the editor, pick `testCounter` in the function menu and press
    **Run**. The execution log should say
    `Counter OK: 9 DailyTest rows for today, e.g. [...]`. It writes only to a
    `DailyTest` tab, created on the first run; `Daily`, where the real counts
    go, is untouched. (Do not test with `testCapture`: it writes a real
    contact row and adds one to the public contact count.)
  - *Check:* `curl -L "<the URL above>?action=stats&token=<STATS_TOKEN>"`
    prints `{"v":1,"rows":[...]}`, and the same without `&token=...` prints
    `{"status":"refused",...}` and no rows; before the publish both printed
    the health check. Then open a page of the live site in a
    browser with neither Do Not Track nor Global Privacy Control on, switch
    to another tab, and run the first `curl` again: today's `visits` row has
    gone up by one.
  - *Unlocks:* counts arriving daily, the first half of Phase 1's "done
    when"; and S2.

- [ ] **S2. Set the repository secret `STATS_SOURCE_URL`** (after S1).
  - *What:* the web app URL with `?action=stats` and the token from S1, that
    is
    `https://script.google.com/macros/s/AKfycbzgyqRUmu0d2UFjb0WxbYyoDbO8F9jVnlvIQnNAfMU0v8JFpH5KAefy4z9BNoQqd68/exec?action=stats&token=<STATS_TOKEN>`.
    (The `Daily` tab published as CSV also works as the source, but a
    published tab can be read by anyone who has its link, unsuppressed, and
    `stats.html` says the raw totals are not public; if you use it, that
    paragraph of `stats.html`, in `scripts/build-content.js`, has to change
    with it.)
  - *Where:* GitHub → the repository → **Settings → Secrets and variables →
    Actions → Secrets** → **New repository secret**, name
    `STATS_SOURCE_URL`. A secret, not a variable: it carries the token. The
    Action never prints the URL, only its host.
  - *Order:* after S1. Before it, `?action=stats` answers with the health
    check, and the Action fails rather than publish that. Without the right
    token it answers `refused`, and the Action fails and says so.
  - *If `main` is protected:* the Action commits `content/stats.json`,
    `stats.html` and the README's budget table straight to `main` as
    `github-actions[bot]`. If a branch rule blocks direct pushes, let GitHub
    Actions bypass it, or the weekly commit fails.
  - *Check:* the Action runs from `main`, where it has been since pull
    request #49: **Actions → Open counts → Run workflow**. Its "Fetch the week's totals"
    step prints `fetch-stats: N row(s) from script.google.com (json), <first
    day> to <last day> → content/stats.json`, or
    `script.google.com has no daily totals yet` if nothing has been counted,
    or `... no full week of them, Monday to Sunday, has ended yet` before the
    first whole week is over (nothing is published until it is); when the
    figures changed, a commit "Update the open counts (weekly totals,
    suppressed below 5)" appears on `main`. After that it runs by itself
    every Monday at 04:17 UTC.
  - *Unlocks:* `stats.html` shows real figures, in whole weeks, every one
    under 5 held back, instead of "Counting has not started yet": the second
    half of Phase 1's "done when". The first figures appear on the Monday
    after the first full Monday-to-Sunday week of counting.

- [ ] **S3. Confirm that the raw daily totals stay private.** Built that
  way in wave 2's review; yours to reverse.
  - *What was decided:* `GET ?action=stats` used to serve the daily totals,
    unsuppressed, to anyone with the web app URL, which is in `count.js` on
    every page, while `stats.html` promised that no count under 5 and no
    single day's count is ever published. A small daily total can say more
    than it seems: a referring site seen once on one day, for example. So
    the endpoint now answers only the token in S1, and the page's promise
    holds from the day counting starts.
  - *If you would rather they were public:* say so. `Code.gs` would drop the
    token check, and `stats.html`'s "Where the raw totals live" and "Two
    limits" paragraphs (in `scripts/build-content.js`) would have to say
    that the daily totals, unsuppressed, can be read at the counter's
    address.
  - *Check:* after S1, `curl -L "<the URL above>?action=stats"`, without a
    token, prints `{"status":"refused",...}` and no `rows`.

- [ ] **S5. Confirm the wording of `stats.html`.**
  - *What:* it speaks in the first person: "Every change I plan for this
    site is a bet about what a reader does on it…" and "kept in a Google
    Sheet in my own Google account".
  - *Where:* the page is generated; its text is in `scripts/build-content.js`
    (`renderStats` and the functions around it). Edit there, then run
    `npm run build:content` and `npm test`.
  - *Check:* <https://moseskolleh.github.io/stats.html>,
    once live, reads the way you would say it.

- [ ] **S6. After four full weeks of counting, record the baseline for the
  four numbers.**
  - *When:* the weeks run Monday to Sunday, Amsterdam time, and each Monday's
    run adds the week just ended. Counting starts once S1 is done and this
    branch is live; the days before the first Monday are in no figure, so
    the first four full weeks are complete about five Mondays later.
  - *What:* from `stats.html`'s week-by-week table, for each of those four
    weeks: messages through the contact form, CV downloads, lens-link visits
    (a proxy, and an upper bound: arrivals through a role link, since the
    totals cannot say whether that reader went on to a case study), the
    share of homepage views that reached Contact, and page views for scale.
    (Brief uses, the fifth, went with The Brief.) Record a `<5` or a `held`
    as it stands, not a guess.
  - *Where:* `docs/plan.md` → "Progress" → Phase 1, step 5: the four weeks'
    Monday dates and their figures. Every weekly version is also kept in git
    (`git log -p content/stats.json`).
  - *Note:* your own page views count too, unless your browser sends Do Not
    Track or Global Privacy Control. Turn one of them on in your browser's
    privacy settings to leave yourself out of the baseline.
  - *Unlocks:* Phase 1 is done, and Phase 2 can be judged against real
    figures ("How to know it worked" in the plan).

- [x] **S7. Decide when the Phase 2 homepage redesign goes live.**
  - *Done:* pull request #50 merged the redesign into `main` on 2026-10-03,
    six days after the counter reached `main` (#49, 2026-09-27), so before
    four full weeks of the old homepage could have been counted. S6's
    baseline is therefore the redesigned homepage's own first four weeks:
    Phase 2 is judged against those, with no before-and-after, and every
    later change against them too. `stats.html` promises nothing more.
  - *Why it mattered:* the baseline in S6 is a baseline of whichever
    homepage is live while it is counted.
  - *Left for you:* when you record S6, say in the plan's "Progress", under
    Phase 1, step 5, that the four weeks are of the redesigned homepage.
  - *Check:* the figures in `docs/plan.md` match `content/stats.json` →
    `weeks` for the same four weeks.

---

## Facts about you the site cannot state yet

**The at-a-glance strip (Phase 2.1).** Wave 3 put a strip of facts under the
homepage hero's copy, written by `npm run build:content` from
`content/profile.json` into `index.html` between the `AT-A-GLANCE` markers.
Today it shows two: the roles you are open to and your location. The four a
recruiter checks next are missing, and a missing fact is left out rather
than shown as "TBC":

| Fact | Where it goes in `content/profile.json` | Today | Item |
|---|---|---|---|
| Seniority | `atAGlance.seniority` | `null`, not shown | F3 |
| Available from | `atAGlance.availableFrom` | `null`, not shown | F3 |
| Languages, with your Dutch level | a top-level `languages` list | absent, not shown | F1 |
| Right to work in the NL and the EU (and whether a visa needs sponsoring) | `atAGlance.rightToWork` | `null`, not shown | F2 |

Each is a short phrase, and "short" is a number: `npm test` refuses a
seniority over 32 characters, a right to work over 48, or languages that
come to more than 80 as the strip writes them ("English (C2) · Dutch
(B1)"). On a phone the strip shares the first screen with the buttons and
the hero's figures, and the limits are what fits.

To check all four at once: after `npm run build:content`, `index.html`
between `<!-- AT-A-GLANCE:START` and `<!-- AT-A-GLANCE:END -->` has a
"Seniority", "Available", "Languages" and "Right to work" line above
"Location", `npm test` passes, and so does `npm run smoke` (the pull
request's smoke job runs it for you): its "first view at" lines check
that the figures are still on the first screen at 1440×900 and 390×844,
and its "longest strip at" lines check the same for the longest strip the
limits allow.

- [ ] **F1. Languages and levels.**
  - *What:* every language you work in, named in English, with a CEFR level
    (A1 to C2) or "native". Dutch matters most: the job market is Amsterdam.
  - *Where:* `content/profile.json`, a new top-level `languages` list (the
    `$languages` note in the file shows the shape):
    `"languages": [{ "language": "Dutch", "level": "B1" }]`.
  - *Unlocks:* the Assay stops treating every non-English language as a gap.
    Today every such requirement reads "Not evidenced on this site. Ask
    Moses.", and an English requirement is listed as "Level of English" to
    confirm with you; with English in the list it is matched instead. The
    same list fills "Languages" in the homepage's at-a-glance strip (Phase
    2.1), which leaves the line out until then; later, `knowsLanguage` in the
    structured data (Phase 5.4).
  - *Check:* `npm run build:content` copies it into `modules/interactives.js`
    and into the at-a-glance strip in `index.html`; `npm test` rejects a
    level that is not A1–C2 or "native". Paste an ad of 20 words or more
    (shorter text is not graded) that asks for "fluent Dutch" into the
    Assay: the Dutch row shows your level.

- [ ] **F2. Right to work, visa sponsorship, driving licence, security clearance.**
  - *What:* whether you have the right to work in the Netherlands and the EU,
    whether an employer would need to sponsor a visa, whether you hold a
    driving licence (and where it is valid), and any security clearance. No
    document numbers.
  - *Where:* right to work and sponsorship: `content/profile.json` →
    `atAGlance.rightToWork`, one short phrase covering both (it is `null`
    today). Driving licence and security clearance have no field yet: no
    page shows them, so give them to whoever next works on the Assay.
  - *Unlocks:* "Right to work" in the homepage's at-a-glance strip, which
    leaves the line out while the field is `null`. Today the Assay only
    lists these, and relocation, under "Confirm with Moses — not stated on
    this site"; it does not read the strip's facts yet.
  - *Check:* after `npm run build:content`, the strip under the hero shows
    it. `npm test` refuses a stand-in such as "TBC" or "n/a": leave the
    field `null` until you can state it.

- [ ] **F3. Target roles, seniority and available-from date** (Phase 2.1).
  - *Where:* `content/profile.json` → `atAGlance`:
    - `targetRoles`: "sustainability, climate-risk, ESG and sustainable-AI
      roles and consulting". The site's availability line said
      "sustainability, climate-risk & ESG roles and consulting"; wave 3
      added sustainable AI, your current field, because plan step 2.1 asks
      for it. That addition is the site's wording, not yours yet: confirm
      it, or correct it. The same words open the hero's "Open to …" line
      and the closing call to action on the case studies, research, open
      counts and EcoPrompt Coach pages ("Open to …: write to me at …"). The
      homepage's Contact section says the same in its own words, written
      by hand in `index.html` ("Open to roles & consulting in
      sustainability, climate risk, ESG and sustainable AI"): if you
      correct the field, correct that line too.
    - `seniority`: `null` today. One short phrase for the level of role
      you are looking for.
    - `availableFrom`: `null` today. `"now"`, or a date as `YYYY-MM` or
      `YYYY-MM-DD`; the strip shows it as "Now", "Jan 2027" or
      "15 Jan 2027". A past date does not fail the build (`npm test`
      prints a notice), so update it when you check `meta.verifiedOn`.
    - The location line comes from `person.locality` and `person.country`.
      `atAGlance.workArea` (`["EU", "remote-friendly"]`, as the page already
      said) follows the roles on the "Open to …" line, where it reads as the
      preference it is rather than as a right to work.
  - *Unlocks:* the first view saying which job you want and when you can
    start. A `null` field is left out of the strip entirely.
  - *Check:* after `npm run build:content`, the strip under the hero shows
    each one, and `npm run build:check` passes.

- [ ] **F4. Which roles count as paid professional experience.**
  - *What:* for each role in `content/profile.json` → `experience`, whether it
    was paid employment. In particular: is the Digital Society School
    researcher role (`experience[0]`) employment?
  - *Where:* today the Assay counts years from every role whose title does not
    say intern, cohort, accelerator, trainee, volunteer or student (the
    `notCountedAsYears` list in `modules/interactives.js`). That counts the
    Digital Society School role and the two Sierra Leone roles (`experience[3]`
    and `experience[4]`). If a role was not paid, the cleanest fix is a field
    on its profile entry that the build copies into the Assay; that is a small
    code change, so say which roles and it can be made.
  - *Unlocks:* an honest "N+ years of experience" line in the Assay.
  - *Check:* paste an ad of 20 words or more that asks for "3+ years of
    experience": the gap row lists exactly the roles you count, and "Not
    counted" names the rest.

- [ ] **F5. Is the Digital Society School role still current?** (Phase 3.10;
  wave 4 made it matter more)
  - *Why ask:* the site says "Present", and the public record has gone
    quiet. The `SustainableAIPrototypes` repository, whose README is titled
    for the Ministry of Finance initiative, was last changed on 2025-11-26.
    The `promptcoach` README says the "original prototype [was] developed
    at the Digital Society School with Ministry of Finance (NL) partners",
    and its `docs/legacy/` holds the EcoPrompt Coach handover document,
    dated January 2026. A handover reads like an ending; only you can say.
  - *Where:* `content/profile.json` → `meta.confirmedOn` (now `null`) and
    `meta.verifiedOn` (now `2026-08-05`). Set both to the day you confirm.
    `confirmedOn` is yours alone: it is your word that the facts still
    hold, and nobody else sets it. `verifiedOn` was set when this file was
    written, not by you, so it is only the day the record is logged as of. If the role has ended, say when: its end
    month goes in `currentRole` and `experience[0]`, and the pages that call
    it current change with them, by hand, in one commit: "Sept 2025 —
    Present" in `index.html`'s experience card, and "Sep 2025–now" and
    "2025–now" in `field-report.html` (the notice `npm test` prints names
    the same places).
  - *Then:* `npm run build:content`, then `npm run cv`, and commit
    `content/profile.json`, `index.html`, `assets/Moses_Kolleh_Sesay_CV.pdf`
    and `assets/cv.hash` together. Since wave 4 the day you set is also the
    surface of the core log: every layer's depth is measured from it, and
    its head reads "LOGGED" and that month (today "LOGGED AUG 2026"). Once
    `confirmedOn` is set, the CV ends "Facts last confirmed" and that day;
    until then it makes no such claim (it used to print "Facts last
    verified" and the logged day, which nobody had confirmed).
    `tests/cv.test.js` fails until the CV is printed again.
  - *Unlocks:* the one open-ended fact on the site stays true. `npm test`
    prints a notice once `verifiedOn` is more than six months old (from
    early February 2027 as it stands).
  - *Check:* `npm test` passes and prints no staleness notice; the core
    log's head shows the month you set.

---

## Evidence behind figures that are off the site or labelled illustrative

- [ ] **E1. A source for the ~30% blind-siting strike rate** (Freetown hard-rock geology).
  - *What:* whose records, how many boreholes, when.
  - *Where:* `content/claims.json` → the `blind-siting` entry, whose basis
    is `illustrative` and checkability `not-checkable` since wave 4 (it says
    no source is recorded): give it a `source` basis with the reference, and
    a URL if there is one. `content/projects.json` → the `groundwater` case
    study → `results[0].basis` says the same and changes with it.
  - *Unlocks:* the "illustrative — not a measured figure" labels on the Seven
    in Ten widget (the borehole game and its scoreboard, on the groundwater
    case study; its copy is `WIDGET_HOSTS.borehole` in
    `scripts/build-content.js`) can be replaced by the basis, and
    `claims.html` lists the 30% as sourced. Without one, the labels stay
    (`tests/widgets.test.js` requires them).
  - *Check:* the basis names the source; the labels are changed in the same
    commit, and `npm test` passes.

- [ ] **E2. How many people the 164 water points serve, and how that was counted.**
  - *What:* a count and its method, e.g. design population per water point
    from project records. Only if one exists.
  - *Where:* `content/projects.json` → `groundwater` → a new entry in
    `results`, with `claim`, `basis` and `verifiable`.
  - *Unlocks:* a "people reached" figure. Until then it stays off the site;
    "10,000+ people" was removed in wave 1 because nothing supported it, and
    `tests/content.test.js` fails if that phrase comes back. A figure with a
    basis would be added, and that guard changed, in the same commit.
  - *Check:* the new result validates (`npm test`), and the page that prints
    the figure cites it.

- [ ] **E3. Method and denominator for the 95% project completion rate (Sierra Drilling) and the 15% efficiency gain (Team & Team).**
  - *Where:* `content/profile.json` → `experience[4]` (Operations Supervisor,
    Sierra Drilling) and `experience[3]` (Field Operations Manager, Team &
    Team International), each with its method and denominator. The file's
    `$figures` note explains why: an outcome rate is not a record fact like
    `teamSize`, so it needs a method before it goes back on a page. The field
    for it is added in the same commit.
  - *Unlocks:* both figures can return. Without them they stay off, and
    `tests/content.test.js` names them as claims without a basis; that guard
    would be relaxed in the same commit that adds the basis.
  - *Check:* `npm test` passes with the figure back on the page.

- [ ] **E4. Evidence for Power BI** (a project, certificate or public repository).
  - *Why:* wave 1 dropped Power BI from the homepage's proof-attached toolkit
    because nothing on the site supports it; Tableau stays, backed by the
    Masterschool training. It is off `field-report.html`'s skills line too,
    and the Assay lists a Power BI requirement as a gap.
  - *Where:* the evidence goes in `content/research.json` (an output) or on
    the education entry it belongs to; then the homepage toolkit can link it.
  - *Unlocks:* Power BI back in the toolkit, on the field report's skills
    line, and matched in the Assay. `tests/content.test.js` fails if the field
    report names a tool the homepage does not show, so the two go back
    together.
  - *Check:* the toolkit's Power BI proof links somewhere that shows it.

- [ ] **E5. Evidence that the Trinidad and Tobago factsheet informed national policy.**
  - *Why:* the CV says it "directly informed national policy"; the site now
    says "produced for national policy use", which is what the case study
    supports.
  - *Where:* `content/projects.json` → `un-disaster` → the factsheet artifact's
    `note`, and `content/research.json` (the same output's `note`).
  - *Unlocks:* the stronger wording, with its basis.
  - *Check:* the note cites the evidence; the homepage and case study match it.

- [ ] **E6. A per-query embodied-carbon factor, if you want Scope 3 quantified.**
  - *What:* a sourced factor, for example from the GAIA framework work, with a
    range.
  - *Where:* `ai-carbon-data.js`, with `source`, `range` and a review date like
    every other factor (`tests/carbon.test.js` fails a factor without them).
  - *Unlocks:* Scope 3 as a number in `carbon-ai.html`'s calculator and in
    its Anatomy of a Prompt at once (Anatomy moved there from the homepage in
    wave 3, and draws the calculator's own figures). Today both name Scope 3
    and exclude it.
  - *Check:* `npm test` passes and the calculator and Anatomy show the same
    figure.

---

## Confirm what the site now says

Wave 1 recorded these where the tests can hold the pages to them. Each is
already on the site; confirm it or give the right value.

- [ ] **K1. Wageningen GPA 7.8/10 (Dutch scale).** On the site since its first
  commit but not on the 2025 CV. Now in `content/profile.json` →
  `education[0].grade`.
- [ ] **K2. Sierra Drilling team of 23 and the 8-week OnePointFive programme.**
  `content/profile.json` → `experience[4].teamSize` and
  `experience[1].programmeWeeks`.
- [ ] **K3. Wuppertal: did you formally lead the six-person team?** The case
  study's role says "Interdisciplinary team of six", and the CV claims
  neither way. Until you say, every page says "Worked in a six-person
  interdisciplinary team": the field report, the case study's `role`, and
  `content/projects.json` → `wuppertal` → `method[0]`. (The homepage badge
  and dossier bullet went with the dossiers; the homepage card is drawn from
  the case study.) If you led it, all three can say so again.
- [ ] **K4. Thesis periods.** The site now uses, everywhere: coastal thesis
  2023–2024 (Wageningen) and soft-path thesis 2020–2021 (Hunan, defended May
  2021). `content/projects.json` → `coastal.period` and
  `water-management.period`.

- [ ] **K5. Whose report the AI footprint is on.** Anatomy of a Prompt now
  says its Scope 2 and Scope 3 (capital goods) lines are those of whoever
  runs the model, and that an organisation buying answers from a hosted
  model reports the carbon as Scope 3, category 1 (purchased services). The
  Ministry of Finance project is still described, in your words, as mapping
  "Scope 2 electricity, Scope 3 hardware, and data-centre water"
  (`content/projects.json` → `sustainable-ai` → `method[0]`, the homepage
  experience entry, the field report). If the ministry's own
  boundary was the hosted-service one, say so and those lines can name it.

- [ ] **K6. The soft-path thesis title.** The site now spells it one way
  everywhere: "Approach to soft path water management: thinking beyond
  cement, steel and pipes — Freetown as case study" (`content/research.json`,
  and in `content/projects.json` → `water-management` the artifact and the
  defence photo's caption, which said "Approach for"). If the title on the
  thesis is different, change all three.

*Check for K1, K2, K4 and K6:* change the value in `content/`, run
`npm run build:content`, and `npm test` names every page that still disagrees.
K3 has no test behind it: the field report and the case study's `role` and
`method[0]` are changed together, by hand. K1's and K2's figures are also in
the claims ledger since wave 4; N1 and N2 ask for the evidence behind them.

---

## Confirm two choices wave 3 made (Phase 2)

Wave 3 made two choices you may want the other way. Neither blocks
anything.

- [ ] **P1. The photo on each project card.**
  - *What:* each of the homepage's six project cards shows one thumbnail,
    chosen from the photos its old dossier already used.
  - *Where:* `content/projects.json` → `caseStudies[i].photo`: `src`,
    `thumb` (the same picture 480px wide), `width`, `height` and `alt`. Any
    photo in that case study's `gallery` will do; one without a 480px
    `thumb` needs one made (`cwebp -resize 480 0 -q 72`), and every image in
    the repository counts against a 3.5 MB budget with about 140 KB free.
    Then `npm run build:content`.
  - *Unlocks:* the cards show the pictures you would pick.
  - *Check:* `npm test` passes (`tests/portfolio.test.js` holds each card's
    stated size to its file), and the homepage's Projects section shows them.

- [ ] **P2. The case studies' photo rows: folded or open?**
  - *What:* the 25 field photos that were in the dossiers are back on their
    case studies, one row under each, folded behind a line such as
    "5 photos" until pressed, so nothing is fetched until then.
  - *Where:* to show them open, add `open` to the `<details class="cs-photos">`
    in `photoStrip()` in `scripts/build-content.js`, then
    `npm run build:content`.
  - *Cost:* open, the six rows make `case-studies.html` about 940px longer
    than folded at 1440×900 (1,288px against 348px), about a screen, which
    takes it past its length ceiling (11.55 screens measured with wave 4's
    seventh case study and findings, 11.85 allowed),
    and a reader who only scrolls would fetch up to 2.2 MB of photos.
    Something of equal length would have to come off the page first, since
    ceilings are not raised.
  - *Check:* nothing to check while they stay folded. Opened, each case
    study shows its photos without a press, and `npm run smoke` passes its
    length check once something of equal length has gone.

---

## Confirm the ESG case and the findings (Phase 3.2 and 3.3, wave 4)

Wave 4 added a seventh case study, GAIA, behind a new ESG & CSRD lens, and
a "Findings & recommendations" stage to every case study. Each sentence is
drawn from the GAIA repository or from what the site already said.

- [ ] **G1. GAIA and the ministry's framework.**
  - *What:* the sustainable-AI case study lists its "Sustainability
    assessment framework for AI use cases" as held by the client ("not mine
    to publish unilaterally"); GAIA, public under your own MIT licence,
    answers a related question. The GAIA case names no partner and does
    not say where GAIA began. Confirm GAIA is yours to publish, and whether
    it is that framework; if it is, the sustainable-AI artifact should say
    so rather than "held by the client".
  - *Where:* `content/projects.json` → `gaia` and `sustainable-ai` →
    `artifacts`.
  - *Why it matters:* the notes this wave worked from say GAIA began as
    "Prototype E" in the prototype deck of the Digital Society School's
    ministry project, so a reader who knows both could take the public one
    for the held one. When the lanes merged,
    GAIA was taken off the sustainable-AI case study's artifacts and kept
    only on its own case, so that case no longer implies the answer.
  - *Also:* whether the ministry may be named at all is D2.
- [ ] **G2. The GAIA case's own facts.** Your role ("Author and
  maintainer"), its period ("2025 — 2026"), and that the web estimator at
  moseskolleh.github.io/GAIA-Framework-/ is live (it could not be reached
  from where this was built). `content/projects.json` → `gaia`.
- [ ] **G3. The findings.** Confirm each, and say more where you can. The
  plan names three that the site does not yet state:
  - which socioeconomic drivers dominated in the coastal thesis (and their
    effect sizes, if the thesis can be cited). Today the coastal finding says
    only that the thesis sets them out;
  - which interventions the Wuppertal report recommended (if the
    municipality agrees). Today the Wuppertal case has no recommendation:
    one that named no measure came off;
  - the decision criteria the sustainable-AI framework gives the ministry,
    if the framework, which the client holds, may be quoted and the ministry
    may be named (D2). Today the case gives the five design principles
    instead.
  `content/projects.json` → `caseStudies[i].findings`; one to four each,
  and `npm test` refuses a figure without a basis.
- [ ] **G4. The method, folded.** Each case study's method now opens on a
  press ("02 Method, four steps"), to make room for the findings and the
  seventh case under the page's length ceiling. Open, the seven methods add
  about 3.3 screens on a phone and 1.2 on a desktop, past the ceiling, so
  something of equal length would have to come off first. For the same
  reason the page's closing note, "Why it is laid out like this", keeps its
  heading and folds its two paragraphs. Today the page is 11.55 screens at
  1440×900 and 19.67 at 390×844, against ceilings of 11.85 and 19.78.
  - *Where:* to show the methods open, `renderCaseStudies` in
    `scripts/build-content.js`; then `npm run build:content`, and
    `npm run smoke` says whether the page still fits.

---

## Your public repositories, as the site shows them (Phase 3.1 and 3.4, wave 4)

Wave 4 put your six public repositories on the site, each described only as
far as the repository itself shows: WaterProject, GAIA-Framework-,
climatematch-pipeline, A-B-Testing-at-Globox, SustainableAIPrototypes and
promptcoach (`content/research.json`, and as artifacts in
`content/projects.json`). The homepage toolkit's proof links point at them.
The coach has one name, EcoPrompt Coach, and the site links its maintained
app as the canonical tool. These are the questions only you can answer.

- [ ] **R1. WaterProject names third-party clients.** Its examples name a
  private client and three organisations it worked for or with, in
  `examples/README.md` and the example scripts beside it. The site names
  none of them, and this checklist does not either: the repository is
  where to look.
  - *What:* decide whether the public repository should keep those names.
    This is a change in WaterProject, not in this site.
  - *Unlocks:* nothing on this site waits for it; it is the same consent
    question as D2, asked of another repository.
  - *Check:* a search of the WaterProject repository for the client and
    organisation names in `examples/` finds only what you have agreed to.
- [ ] **R2. The SQL label, "PostgreSQL · MySQL".** The homepage's toolkit
  labels SQL that way, but its proof, the GloBox A/B test, is plain SQL that
  shows neither.
  - *Where:* `index.html`, the toolkit's SQL row
    (`<span class="toolkit-sub">PostgreSQL · MySQL</span>`). Confirm the
    label, or drop it (the line then reads "SQL" alone), or point the proof
    at public work that uses them.
  - *Check:* `npm test` passes; the CV prints the toolkit from the
    homepage, so run `npm run cv` after changing it.
- [ ] **R3. A public machine-learning project, if there is one.** Machine
  learning's proof says "Google Advanced Data Analytics certificate; no
  public project yet" and links nowhere.
  - *What:* a public notebook or repository of yours that shows it.
  - *Where:* a new public output in `content/research.json` (a `github.com`
    URL is already trusted), then the toolkit's machine-learning row in
    `index.html` becomes a link to it, as the others are. R7 asks the same
    of GIS.
  - *Check:* `npm test` passes; `npm run cv` again.
- [ ] **R4. Is the Tableau Public dashboard still live?** Tableau's only
  evidence is the GloBox README's link to it
  (`public.tableau.com/views/Data_Sprint_MasterSchool_Project/...`). The
  site links the repository, and says the README links a dashboard.
  - *Check:* open the link in the GloBox README. If it is gone, Tableau's
    proof has nothing behind it: say so, and the row is reworded or
    dropped.
- [ ] **R5. Are the apps the site points to live?**
  - *The EcoPrompt Coach app,* <https://moseskolleh.github.io/promptcoach/>:
    `carbon-ai.html` and the homepage's section 05 link it directly, as the
    maintained version. It could not be reached from where this was built.
  - *WaterProject's standalone web app:* its README says GitHub Pages has
    to be pointed at its `docs/` folder once, so the site says only "the
    repo links a browser app" and links the repository, not the app. If it
    is live, say so; linking the Streamlit app
    (`waterproject.streamlit.app`) as well would need its host added to
    `TRUSTED_HOSTS` in `scripts/lib/content.js`.
  - *GAIA's web estimator* is G2.
  - *Check:* each address opens the app.
- [ ] **R6. A licence for climatematch-pipeline** (your choice). It has no
  licence file, and its entry in `content/research.json` says so ("code on
  GitHub, with no licence file").
  - *Where:* a `LICENSE` file in that repository; then that `note` in
    `content/research.json` drops the words, and `npm run build:content`.
  - *Check:* `research.html` no longer says it has none.
- [ ] **R7. Public GIS work, if there is any.** The toolkit's QGIS & ArcGIS
  row links the groundwater case study and says "on request; no public GIS
  project yet": its maps are on request, and WaterProject, the case study's
  one public repository, shows no QGIS or ArcGIS work (it mentions them
  only as a planned import in `docs/geolibre_integration.md`).
  - *What:* a public map, project file or repository of yours that shows
    QGIS or ArcGIS work, or permission to publish one of the groundwater
    maps.
  - *Where:* a public artifact on the groundwater case study in
    `content/projects.json` whose name or note says it is QGIS or ArcGIS
    work (or a new output in `content/research.json`); then the row in
    `index.html` drops "on request; no public GIS project yet".
  - *Check:* `npm test` passes (`tests/content.test.js` accepts a case
    study as a proof only when a public artifact of it names the tool);
    `npm run cv` again.

---

## The claims ledger: figures only you can evidence (Phase 3.6, wave 4)

`content/claims.json` now holds every figure the site prints, with its one
basis and whether a reader can check it: public (with where), on request, or
not checkable from outside. [`claims.html`](../claims.html), "Check my
numbers", lists them all. Some of those labels are promises only you can
keep, and some figures could move to "public" with a link only you have.

- [ ] **N1. Will you send the evidence for the four "on request" figures?**
  The two master's degrees, the three continents, the four countries and the
  Wageningen GPA of 7.8/10 (K1) are marked on request, on the understanding
  that you will send the degree certificates and the transcript when a
  reader asks. For Germany, one of the four countries, the evidence is the
  UNDRR internship, as you record it, not a degree: say if you hold a
  document for it.
  - *Where:* `content/claims.json` → the `masters-degrees`, `continents`,
    `countries` and `wur-grade` entries → `checkable`. If you would not send
    them, each becomes `not-checkable`.
  - *Check:* `npm test` passes, and `claims.html` lists each where it
    belongs.
- [ ] **N2. A link or a document for the figures nobody can check.** These
  are labelled not checkable from outside today:
  - the team of 23 at Sierra Drilling and the 8-week OnePointFive programme
    (K2): `content/claims.json` → `team-size` and `programme-weeks`;
  - the six people in the Wuppertal consultancy team and the five months
    with UNDRR, which the site writes in words and which are entries now:
    `wuppertal-team` (from `education[0].consultancyTeamSize` in
    `content/profile.json`) and `undrr-months` (counted from the
    internship's dates; the build fails if the two disagree). Confirm both;
  - the 164 water points (100 wells rehabilitated, 50 boreholes, 14 solar)
    and the 70% strike rate, from the field records: these are the
    groundwater case study's results, so their checkability is set there,
    in `content/projects.json` → `groundwater` → `results[i].verifiable`
    (true or false), and the ledger follows it.
  - *What:* a public link, or a document you will send on request.
  - *Unlocks:* the team size and the programme's length move to "public"
    with the link, or to "on request". A result has only two states: with a
    public link its `verifiable` becomes `true` and its `check` holds the
    link (the build refuses a result called checkable with no `check` and no
    public work in its case study); records you would send on request can
    be named in its `basis`,
    but it stays "not checkable from outside" unless results are given an
    on-request state (a small change to `scripts/lib/content.js`; say if
    you want it).
  - *Check:* `npm test` passes; `claims.html` shows the new label.
- [ ] **N3. The footer's "~22 MB".** The homepage footer now says "Before
  this redesign, this page loaded ~22 MB of images on arrival". It said
  "~25 MB", which no record supported; 22 MB is the four hero photos and
  the profile photo as they were at commit `3d7ab78`
  (`content/claims.json` → `old-images`).
  - *What:* confirm the corrected line, or say what the 25 came from.
  - *Check:* nothing to change if you confirm it.
- [ ] **N4. Two results that were labelled checkable, with nowhere to
  check them.** The coastal case's "10,226 sub-basins modelled" and the
  soft-path case's "Successfully defended at Hunan University, May 2021"
  said "Checkable from outside" on the homepage cards, the case studies
  and the CV, while the site cited no source for the
  count, and `claims.html` filed the same degree certificate under "on
  request". Both now say "not checkable from outside".
  - *What:* for the count, open Wageningen University's MARINA page,
    `https://www.wur.nl/en/research/products-services/marina-model-assess-river-inputs-pollutants-seas`.
    A web search shows it saying the model "is applicable for 10,226
    sub-basins of the world", but nobody building the site could open it.
    If it says so, it is the place to check the figure. For the degree, an
    outside route to verify it, if you have one (an online verification
    report from China's degree authority, for example).
  - *Where:* `content/projects.json` → `coastal` or `water-management` →
    `results[0]`: add `"check": "<the address>"` and set `verifiable` to
    `true`; add the host to `TRUSTED_HOSTS` in `scripts/lib/content.js`,
    with a line saying you opened it. Then `npm run build:content` and
    `npm run cv`.
  - *Check:* `npm test` passes; the card says "Checkable from outside", and
    `claims.html` links the address.

---

## The CV, consent, certificates and testimonials (Phase 3.5, 3.7 and 3.8, wave 4)

- [ ] **D1. Read the generated CV, and say what it should add.**
  - *Why:* the CV made on 2025-11-17 still said "10,000+ beneficiaries", "95%
    project completion rate", "efficiency by 15%", "3+ years" and Power BI.
    Since wave 4, `npm run cv` prints `assets/Moses_Kolleh_Sesay_CV.pdf` from
    `content/` and the homepage, so it says only what the site says, and the
    tests fail if it falls behind. Two things on the old one are not on it:
    the Ministry of Finance as the partner (D2), and the relevant courses
    under each degree, which the site does not list. Your phone number is on
    it, because the homepage's contact card publishes it; it is
    `person.phone` in `content/profile.json`, and a test holds the homepage
    to it.
  - *Where:* anything you want on it goes on the site first (`content/profile.json`
    or the homepage), then `npm run cv`. If you would rather not publish the
    phone number, take it off both: the contact card in `index.html` and
    `person.phone`.
  - *Check:* `npm test` passes (`tests/cv.test.js`), and the PDF reads as you
    would want a recruiter to read it.
- [ ] **D2. May the site and the CV name the Ministry of Finance as the partner?**
  - *Why:* the plan says partner names stay out without their consent, and
    the site has named the ministry since before this plan. The old CV did
    too. The new CV leaves it off until you confirm the ministry has agreed
    to be named, and wave 4 added no new mention anywhere on the site.
  - *Where it is named today:*
    - `carbon-ai.html`'s hero tag, "DIGITAL SOCIETY SCHOOL · MINISTRY OF
      FINANCE (NL)";
    - the sustainable-AI case study: `content/projects.json` →
      `sustainable-ai` → `partner`, and its held framework's `heldBy`
      ("Digital Society School / Ministry of Finance"), on
      `case-studies.html`;
    - `content/lenses.json` → the `sustainable-ai` lens's first evidence
      line;
    - `content/profile.json` → `currentRole.partner`, and on the homepage
      (`index.html`, written by hand) the journey's Amsterdam stop, Field
      Note 03 and the experience card's "Partner" line;
    - the field terminal's projects list (`modules/terminal.js`) and the
      Assay's evidence line (`modules/interactives.js`);
    - three times in `field-report.html`.
  - *Off the site:* the `SustainableAIPrototypes` repository's README is
    titled "Ministry of Finance - Sustainable AI Initiative", and the
    `promptcoach` README names "Ministry of Finance (NL) partners"; the site
    now links both.
  - *Where:* tell us yes or no. Yes: the CV can name it, from
    `currentRole.partner`, and the two checks in `tests/cv.test.js` that
    keep it off the CV go. No: every mention above comes off in one commit
    ("a ministry", or the Digital Society School alone), and the two
    READMEs are yours to change.
- [ ] **D3. A verification link for each certificate** (Phase 3.8).
  - *Why:* four certificates are listed with nothing a reader can check them
    against. Each can link the issuer's own page for it, on the homepage and
    the CV, as "Verify".
  - *Where:* `content/profile.json` → `certifications[i].verifyUrl`, one https
    address each, then `npm run build:content && npm run cv`. Leave the field
    out where there is none (never `null` or "TBC"; the build refuses them).
    - `certifications[0]`, ESG Specialist Program (Corporate Finance
      Institute): its page on `credentials.corporatefinanceinstitute.com`,
      already accepted.
    - `certifications[1]`, Google Advanced Data Analytics (Coursera):
      `coursera.org/verify/...` or `coursera.org/account/accomplishments/...`,
      already accepted.
    - `certifications[2]`, Data Analytics Training (Masterschool), and
      `certifications[3]`, Synergizing DRR & Climate Change Adaptation (UN
      System Staff College): their hosts are not known yet. Send the link,
      and its host is added to `VERIFY_HOSTS` and `TRUSTED_HOSTS` in
      `scripts/lib/content.js` once someone has opened it.
  - *Check:* `npm test` passes, and each Verify link opens the certificate.
- [ ] **L1. Two or three testimonials, with permission** (Phase 3.5; its
  number is from when it was listed under later phases).
  - *What:* two or three people you have worked with, each agreeing to be
    quoted, with an excerpt of at most 200 characters.
  - *Where:* `content/testimonials.json` → `testimonials`, one entry each
    (the file's comment gives the shape):
    - `quote`: the excerpt, at most 200 characters;
    - `name`, and `role`: theirs, as they would want it shown;
    - `relationship`: how they know your work ("managed me at …");
    - `source`: either `{ "type": "linkedin", "url": "…" }`, their
      recommendation's address on linkedin.com: the recommendations page
      of your profile, `https://www.linkedin.com/in/<you>/details/recommendations/`,
      where the quote is shown (a bare profile address is refused), or
      `{ "type": "on-request", "permissionDate": "YYYY-MM-DD" }`, the day
      they agreed, if it is not public and you will put a reader in touch.
    Then `npm run build:content`.
  - *Unlocks:* the testimonials block under the core log on the homepage.
    Until there is one entry it shows nothing at all. The build refuses a
    quote without a source, a fourth entry or a quote over 200 characters,
    and one that states a figure the claims ledger does not hold as the
    quote writes it: "164 water points" is fine, and is marked like any
    other; "a team of 23" needs a form, `"team of 23"`, on the team-size
    entry in `content/claims.json` (the build names the figure).
  - *Room:* none yet, at full length. The homepage is 9.42 of 9.79 screens
    at 1440×900 and 16.49 of 17.09 at 390×844. Measured on this branch when
    it was 16.46 on a phone, with stand-in quotes of 200 characters, one
    takes it to 9.80 on a desktop,
    just over (on a phone, 16.86, within), and two to 9.80 and 17.18, over
    both. So before the first goes in, about a hundredth of a desktop screen
    has to come off the homepage, and for two, about a tenth of
    a phone screen as well; shorter quotes cost less. `npm run smoke`
    measures it and fails a page over its ceiling, which only moves down.
  - *Check:* `npm test` passes and the homepage shows each quote with who
    said it and where to check it.

---

## The notes and the health checks (Phase 5 and 6.9, wave 5)

Wave 5 moved the Assay to a page of its own, The Brief (`brief.html`,
retired on 2026-10-28, which took B1 and B2 with it), made the Field
Notes dated articles with a feed and a preview card each, and added a
weekly "Site health" issue. These are the choices it made for you, and
one switch for the health check.

- [ ] **H1. Give the health check its token: `HEALTH_TOKEN`, then the
  repository secret `HEALTH_URL`** (after C2).
  - *What:* once a week, `.github/workflows/health.yml` can send one test
    message down the contact form's own path (the same checks and limits a
    visitor's message meets), into a `Health` tab of the same spreadsheet,
    emailing nobody and counting nothing. Without it, nothing shows each
    week that the live form still records a message.
  - *Where:* in the Apps Script project's Script Properties, add
    `HEALTH_TOKEN`: a long random string, not the same as `STATS_TOKEN`.
    Publish the current `Code.gs` (C2). Then in the repository, **Settings
    → Secrets and variables → Actions → New repository secret**: name
    `HEALTH_URL`, value `<the web app URL>?action=health&token=<HEALTH_TOKEN>`.
    In the editor, the function `testHealth` does the same without the
    token, as a first try.
  - *Check:* **Actions → Site health → Run workflow**. The issue's line
    "The contact form, end to end" passes, and a row appears in the
    `Health` tab.

- [ ] **H2. An X profile, if you want one listed** (Phase 5.4). The plan
  named "the missing X profile in `sameAs`", but `content/profile.json` →
  `links` has none, so the structured data lists GitHub and LinkedIn only.
  If you use one and want it there, add its address as `links.x` and say
  so; `personLd` in `scripts/build-content.js` takes one line to list it.
  If not, tick this as "none".

- [ ] **L5. The notes as articles: their dates, their summaries and one
  changed line.**
  - *Dates:* all three are dated 6 July 2026, the day they first went on
    the site (`916a7c7`, pull request #20), and each says "First published
    on this site". If you wrote them earlier and want that date, say so.
  - *Summaries:* each note's one line on the homepage and in the feed is a
    sentence lifted from the note itself, since none had been written. Say
    if you want your own.
  - *One line:* note 3 pointed at the homepage chart as "further down"; on
    a page of its own it says "on the homepage", linked.
  - *The ministry:* note 3 names "the Dutch Ministry of Finance", as the
    homepage's note always has, while the CV leaves it unnamed (D2). It now
    has a permalink and an entry in the feed. If D2's answer is no, the
    note's sentence changes with it.
  - *Where:* `content/notes/*.md`, then `npm run build:content`,
    `npm run og` and `npm test`.

---

## Later phases

- [ ] **L2. One Field Note a month** (Phase 5.2), starting with the six topics
  in the plan. Since wave 5 a note is a markdown file in `content/notes/`
  (copy one of the three there; the README's "Field Notes and the feed"
  says what each front-matter line means), then `npm run build:content`,
  `npm run og` (its preview card) and `npm test`. The notes share one
  byte and length budget sized for today's notes of about a hundred
  words: a longer note needs those ceilings in `scripts/check-budget.js`
  raised on purpose, with something of the same weight taken out
  elsewhere. Once notes are dated, a long gap between them shows; a
  rhythm you can keep (one a quarter, say) beats one you cannot.
- [ ] **L3. A custom domain, if you want one** (Phase 5.5). The other half
  of this item is done: you renamed the repository to
  `moseskolleh.github.io` on 2026-10-17, so the site is the root of
  `https://moseskolleh.github.io/` and the academicpages template is gone;
  wave 6 moved every address on the site to the root, and old
  `/sustaintheworld/…` links go on to the same page there. Update the
  address on LinkedIn and anywhere else you gave it (the old one still
  works, through the forward, but the new one is shorter and is what
  search engines are now told). A custom domain (`moseskolleh.com` or
  `.nl`) is still open: buy it, add a `CNAME` file and the domain in the
  repository's Pages settings, then change `links.site` in
  `content/profile.json` and run `npm run build:content`, `npm run og`
  and `npm run cv`.
- [ ] **L4. A native-speaker review of the Dutch pages** (Phase 5.6), once
  they exist.
