# What only Moses can do or supply

The single list of everything the site needs from Moses: facts only he can
state, evidence only he holds, and checks on accounts only he can open. It
grows from the "What only Moses can supply" table in [docs/plan.md](plan.md)
and from what each wave of work found. An item is
ticked only once it can be seen to be done: in the repository, on the live
site, or by Moses saying so. One item is ticked, S7, because the repository
shows it done; nothing else is yet.

Each item says what is needed, where it goes, what it unlocks, and how to
check it. A path such as `content/profile.json` → `experience[5].teamSize`
means that file, then that field (lists count from 0). After editing anything
in `content/`, run `npm run build:content` and then `npm test`.

Last updated with the PhD update, 2026-10-28. Waves 1 to 6 of the plan are
on `main` (pull requests #48 to #54). The PhD update is in its own pull
request until it is merged, which must not be before 2 November 2026 (U1).
It opens your PhD at IUSS Pavia, closes the Digital Society School role
(it ended in February 2026), moves the site to Pavia, offers research
collaborations only, removes the narration and retires The Brief. Where a
claim had no record behind it, the update applied the safe default and
dropped or softened it; each can come back with its evidence. Its questions
are the group headed "The PhD update" (U1 to U12) and new or rewritten
items in the other groups: F1 to F5, E1, E5 and E7 to E12, K1, K3, K5 and
K7 to K11, G1 to G4, R5, R8, N1, N2, N4, D1, D2, D4, H2, L1, L4 and L5.
Five items went with what was removed: V1 and V2 with the narration, and
S4, B1 and B2 with The Brief.

**Start here.** Of the items below, these unlock the most. Everything else
can wait for them.

1. **U1** — merge the PhD update on or after 2 November 2026, not before.
   Until that day it would call a PhD that has not begun "Present".
2. **C1, C2, C3** — prove the contact form works on the live site. Nobody
   has yet, and every page's visit counter posts to the same deployment.
   The 2025 versions of the script would record each page view as a
   message and email it to you; if the one-line check at the top of S1
   says the live script might be one of those, do C2 at once.
3. **S1, S2** — switch on the visit counts. Until then the open-counts job
   runs each Monday and finds nothing, the four-week baseline every later
   change is judged by (S6) cannot start, and the sustainability statement
   (Phase 4.2) has no data.
4. **U2, U3, D2** — read what the site now says about the PhD, check
   IUSS's rules on paid outside work, and say whether the Digital Society
   School's government partner may be named. Each is a default the update
   chose for you.

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

## The PhD update: what only you can settle (October 2026)

The PhD update rewrote the record on 2026-10-28 from what you confirmed on
27 and 28 October: the PhD at Scuola Universitaria Superiore IUSS Pavia
from November 2026, co-funded by BrianzAcque, described only as the public
call describes it; the Digital Society School role, September 2025 to
February 2026, in the past tense and credited to the team; Pavia as where
you are; research collaborations as all the site offers; and your ORCID iD.
These are what it could not settle for you.

- [ ] **U1. Merge the PhD update on or after 2 November 2026.**
  - *Why:* the update logs the record as of 2 November 2026, the PhD's
    first working day (`meta.verifiedOn` is `2026-11-02`). From that day
    the site says "Nov 2026 — Present" for the PhD, "2026 — Now" at the
    Pavia stop, "LOGGED NOV 2026" at the head of the core log, and "As of
    November 2026" over the research page's "Now researching" block.
    Merged earlier, each says something that is not yet true. The build
    refuses a role that starts after `meta.verifiedOn`, and the research
    page's block may not be dated later than it, so none of them can be
    dated earlier without moving the PhD's start.
  - *Where:* the pull request; nothing to edit. If the start moves, these
    change together: `content/profile.json` → `meta.verifiedOn`,
    `experience[0]` (its dates and `start`) and `education[0]`;
    `content/research.json` → `now.asOf` and the `phd-thesis` summary
    ("begun in November 2026"); then `npm run build:content` and
    `npm run cv`.
  - *Check:* the merge is dated 2 November 2026 or later, and the live
    homepage's core log reads "LOGGED NOV 2026".

- [ ] **U2. Read what the site now says about the PhD and Pavia, and
  approve it or change it.**
  - *What:* the update's own words, each from the public call or from what
    the site already said:
    - the hero's value line, "I study what climate risk costs, and what
      adapting to it is worth." (it must stay on one line at 1366px wide,
      so a replacement has about 66 characters), and the end of the
      description under it, "— and now my PhD is on urban flood risk.";
    - About: "Today my focus is urban flood risk — a PhD at IUSS Pavia on
      extreme rainfall and the drainage of Monza and Brianza.";
    - the availability line, "Open to research collaborations on climate
      and flood risk, water and ESG", and the contact section's "— based
      in Pavia, Italy" after it;
    - the Pavia stop: "Back to water: a PhD at IUSS Pavia on urban flood
      risk, co-funded by BrianzAcque.";
    - the core log's PhD layer: its title, "Co-funded by BrianzAcque, a
      water utility" (the longer "the water utility of Monza and Brianza"
      wraps to a second line there and makes the homepage too long), and
      its three lines from the call, written as aims ("To assess …", "To
      estimate …", "To weigh …"), since none of the work has been done yet;
    - the PhD's degree card: "In progress, expected 2029" and "Topic:
      urban flood risk and drainage adaptation";
    - the research page's "Now researching" block: the question; why it
      matters, in the call's own words ("highly urbanised and exposed to
      pluvial flooding"; a line on how the drainage was designed was
      dropped, since the call says nothing of it); the four things the
      work will do; and the four things it does not claim yet. The call's line about
      building on existing hydrological and hydraulic modelling results is
      left out, since it could read as a model or data already in hand;
      add it if you want it;
    - the planned thesis: the topic title of the funded position, "expected
      2029" and "begun in November 2026". When the thesis has a title of
      its own, it replaces this one.
  - *Where:* `index.html`, by hand (the hero, About, the journey, the core
    log, the degree card and the contact section), and `field-report.html`,
    which repeats them; `content/profile.json` → `atAGlance.targetRoles`,
    `experience[0]` and `education[0]`; `content/research.json` → `now`
    and the `phd-thesis` output. Then `npm run build:content`, `npm run cv`
    and `npm run og`.
  - *Room:* the homepage is 9.70 of its 9.74 screens on a desktop and the
    field report 4.38 of 4.40, so a longer line needs a shorter one beside
    it.
  - *Check:* `npm test` passes, and so does `npm run smoke`'s length check.

- [ ] **U3. Check IUSS's rules on paid outside work before "consulting"
  comes back.**
  - *What:* whether the PhD's rules allow paid outside work, and whether
    BrianzAcque's co-funding comes with exclusivity or conflict-of-interest
    terms. Until you have checked, the site offers research collaborations
    and nothing else: no consulting, no roles, no job search.
  - *Where:* `content/profile.json` → `atAGlance.targetRoles` (the build
    writes "Open to " before it, on the homepage, in every other page's
    closing call to action, on the CV and on the homepage's preview card),
    and the contact section's line in `index.html`, by hand.
    `tests/firstview.test.js` holds both to offering no consulting and no
    roles, so it changes in the same commit.
  - *Unlocks:* a line such as "and consulting where my PhD allows", on
    flood risk, water and climate risk.
  - *Check:* `npm test` passes; then `npm run cv` and `npm run og`.

- [ ] **U4. Whether your supervisor may be named, once appointed.**
  - *What:* the site names nobody at IUSS: neither the person the call
    named for the position nor a supervisor. Once the doctoral board has
    formally appointed your supervisor, say whether they may be named, and
    how.
  - *Where:* `content/research.json` → `now.position`, one clause. The
    repository is public, its comments, docs and commit messages included,
    so until then nothing about the PhD goes in it beyond what the public
    call says.
  - *Check:* the clause reads as your supervisor would want it.

- [ ] **U5. Your ORCID record, an IUSS email and an Italian number.**
  - *What:* the site now links your ORCID iD,
    <https://orcid.org/0009-0002-9429-1672>, in the contact section, on the
    CV, in the field report and in the structured data. Make the record
    public, and add IUSS Pavia as your affiliation there (your degrees too,
    if you like), so the link shows what the site says. When IUSS gives you
    an email address, and when you have an Italian or IUSS phone number,
    send them: the site keeps `+31 659 361 423` until then.
  - *Where:* the record is on orcid.org, signed in as you. The email and
    the phone are `content/profile.json` → `person.email` and
    `person.phone`, and the homepage's contact card in `index.html`, by
    hand (a test holds the card's number to `person.phone`).
  - *Check:* signed out, the ORCID link shows your record with IUSS on it;
    `npm test` passes, then `npm run cv`.

- [ ] **U6. Consent for the photos that show other people.**
  - *What:* whether the people in these photos agreed to appear on your
    site, or which photos to swap or crop:
    - the drilling crew: the hero's first slide
      (`groundwater-mapping-1-hero`), and `groundwater-mapping-2`, `-3`
      and `-4` on the groundwater case study;
    - the Wuppertal consultancy team: the hero's second slide
      (`wuppertal-resilience-1-hero`), and `wuppertal-resilience-1` and
      `-5`;
    - the Digital Society School team: `sustainable-ai-4` and `-5`;
    - the seminar room at Wageningen: `coastal-pollution-2`;
    - Hunan: the graduates in `soft-path-5`, and the colleague in
      `soft-path-6`.
  - *Where:* the photos are in `assets/img/`; each case study's `photo`
    and `gallery` are in `content/projects.json`; the hero's slides are in
    `style.css` (`.hero-bg-1` to `.hero-bg-4`) and `index.html`. Keep the
    consents themselves to yourself: the repository is public, and a
    photo's entry takes no field for them.
  - *Cost:* the hero's first slide is preloaded and counts in the
    homepage's first view. Swapping it changes the preload, the captions
    in `script.js`, `tests/images.test.js` and the first-view figure
    (`first-view` in `content/claims.json`, which the footer quotes).
  - *Check:* `npm test` and `npm run smoke` pass with the new photos.

- [ ] **U7. Bring LinkedIn and older copies of your CV in line with the
  site.**
  - *What:* for want of a record, the site no longer says "10,000+
    beneficiaries", a "95% project completion rate", "efficiency by 15%",
    "3+ years", "directly informed national policy", Power BI, "top of
    class", a 25% gain in UNDRR's coverage, a 30% rate for drilling blind,
    or LCA, carbon markets, circular economy and SASB. It dates the Digital
    Society School role September 2025 to February 2026, and the PhD from
    November 2026. Look for those figures and dates on LinkedIn and in any
    CV or application you have sent since 2025, the one to IUSS among
    them, and change them there too, or send the evidence and they come
    back here (E1 to E9 say where).
  - *Where:* off the site: LinkedIn, and your own files. Nothing in this
    repository.
  - *Check:* LinkedIn says what the CV the site prints
    (`assets/Moses_Kolleh_Sesay_CV.pdf`) says.

- [ ] **U8. Confirm the corrections to the three notes.**
  - *What:* each note was changed after it was published, and says so in
    a dated last line:
    - Note 01, "What 164 water points taught me about data": "In hard
      rock…", "The boreholes we sited from resistivity surveys struck
      water 70% of the time…", "every analysis I do now" (it said "every
      AI framework I build now"), and "*Corrected October 2026: the 70% is
      a share of the holes drilled, not a gain over drilling blind.*";
    - Note 02, "Why I wrote a pessimistic future on purpose": "Model
      output alone seldom moves a decision; a story people can picture
      often does.", "it rarely counts", "I now write the storyline first
      and let it set the questions for the numbers, never the answers.",
      and "*Wording softened in October 2026.*";
    - Note 03, "Every prompt has a footprint — so what?": "I helped
      build…", "a Dutch government partner", and "*Corrected October 2026:
      this first said "I'm building"; that work ended in February 2026.*"
  - *Where:* `content/notes/*.md`, then `npm run build:content`,
    `npm run og` and `npm test`. Each note is close to its length ceiling
    on a phone (Note 03 is 2.04 of 2.06 screens), so a longer line needs a
    shorter one in the same note.
  - *Check:* the three notes, and `feed.xml`, read as you would put it.

- [ ] **U9. The note at The Brief's old address, and when to delete it.**
  - *What:* `brief.html` now reads: "This address held The Brief, which set
    a job ad against the work on this site. I am not looking for a job
    now, so I have taken it down; a link to one of its fits now opens this
    note instead. The work it drew on is all still here." Change it if you
    would put it differently. Visits to it are still counted, as "The
    Brief (retired)" on `stats.html`; once they stop, the address can be
    deleted outright.
  - *Where:* `brief.html`, by hand (the build writes only its nav, its call
    to action, its footer and its policy). Deleting it takes the file, its
    length ceiling in `scripts/check-budget.js`, its name in
    `scripts/build-content.js`, the `/#assay` forward in `script.js`, and
    the smoke and test checks that ask for it, in one commit.
  - *Check:* `npm test` and `npm run smoke` pass.

- [ ] **U10. Clear away what the narration left outside the repository.**
  - *What:* revoke your Fish Audio API key, and disconnect the Fish Audio
    connector in your claude.ai settings; the site no longer uses either.
    If you have a local `.env` file or `.voice-auditions/` folder from the
    old pipeline, delete them: git ignores both, so the repository never
    held them.
  - *Where:* your Fish Audio account, your claude.ai settings and your own
    computer.
  - *Check:* Fish Audio lists the key as revoked.

- [ ] **U11. Approve the lenses' new wording.**
  - *What:* the lenses spoke to someone hiring ("Best fit for: Roles in …",
    the ESG lens offering sustainability consulting, and the homepage's
    "read them as a water role"). Since the site offers research
    collaborations only, each lens now reads "Best fit for: Collaborations
    on …", the ESG lens no longer names consulting, and the homepage reads
    them "for water". Change the wording if you would put it differently;
    consulting comes back only after U3.
  - *Where:* `content/lenses.json` → each lens's `bestFor`; the label
    "Best fit for:" in `scripts/build-content.js`; the projects section's
    line in `index.html`, by hand. The quarterly review checks the lenses
    against `atAGlance.targetRoles`.
  - *Check:* `npm run build:content`, then `npm test`.

- [ ] **U12. Which outputs the research page folds away.**
  - *What:* the research page now lists the theses and reports before your
    coursework and this site's own scripts, which are folded under "Also
    public", behind "Coursework, and this site's own pages and scripts":
    the EcoPrompt Coach page and its factor set, the GloBox A/B test, the
    Field Notes and the journey-map generator. Nothing was removed. You
    may want some of them out of the list altogether, or the EcoPrompt
    Coach pair back among the public work; unfolded, they would take the
    page past its length ceiling on a phone. The groups by availability
    (public, on request, held by the client, planned) stay as they were, so
    public code still comes before the theses.
  - *Where:* `content/research.json` → each output's `aside`.
  - *Check:* `npm test` passes, and `npm run smoke` measures the page.

---

## Facts about you the site cannot state yet

**The at-a-glance strip (Phase 2.1).** Wave 3 put a strip of facts under the
homepage hero's copy, written by `npm run build:content` from
`content/profile.json` into `index.html` between the `AT-A-GLANCE` markers.
Today it shows two: what you are open to (research collaborations, U3) and
where you are (Pavia). It was built for a job search: three of the four
facts it leaves out, seniority, a start date and a right to work, are what
an employer asks, and while you are not looking for work they can stay
unstated. The fourth, your languages, a research collaborator may still
want. A missing fact is left out rather than shown as "TBC":

| Fact | Where it goes in `content/profile.json` | Today | Item |
|---|---|---|---|
| Seniority | `atAGlance.seniority` | `null`, not shown | F3 |
| Available from | `atAGlance.availableFrom` | `null`, not shown | F3 |
| Languages, with your Italian and Dutch levels | a top-level `languages` list | absent, not shown | F1 |
| Right to work in Italy and the EU (and whether a visa needs sponsoring) | `atAGlance.rightToWork` | `null`, not shown | F2 |

The weekly health issue lists each fact in this table as waiting on you
while it is unstated. If you would rather it stopped asking for the three an
employer asks, say so: their rows come out of this table, and
`tests/health.test.js` changes with it in the same commit.

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
    (A1 to C2) or "native": Italian, now that you live and work in Italy,
    and Dutch among them.
  - *Where:* `content/profile.json`, a new top-level `languages` list (the
    `$languages` note in the file shows the shape):
    `"languages": [{ "language": "Dutch", "level": "B1" }]`.
  - *Unlocks:* "Languages" in the homepage's at-a-glance strip, which leaves
    the line out until then, and `knowsLanguage` in the structured data.
  - *Check:* `npm run build:content` copies it into the at-a-glance strip in
    `index.html` and the structured data; `npm test` rejects a level that is
    not A1–C2 or "native".

- [ ] **F2. Right to work, visa sponsorship, driving licence, security
  clearance: only if you look for work again.**
  - *What:* whether you have the right to work in Italy and the EU, whether
    an employer would need to sponsor a visa, whether you hold a driving
    licence (and where it is valid), and any security clearance. No
    document numbers. While you are not looking for work, none of it is
    needed: leave it unstated.
  - *Where:* right to work and sponsorship: `content/profile.json` →
    `atAGlance.rightToWork`, one short phrase covering both (it is `null`
    today). Driving licence and security clearance have no field, and no
    page asks for them now that The Brief is retired.
  - *Unlocks:* "Right to work" in the homepage's at-a-glance strip, which
    leaves the line out while the field is `null`.
  - *Check:* after `npm run build:content`, the strip under the hero shows
    it. `npm test` refuses a stand-in such as "TBC" or "n/a": leave the
    field `null` until you can state it.

- [ ] **F3. What you are open to; and, only if you look for work again,
  seniority and an available-from date** (Phase 2.1).
  - *Where:* `content/profile.json` → `atAGlance`:
    - `targetRoles`: "research collaborations on climate and flood risk,
      water and ESG" since the PhD update (it said "sustainability,
      climate-risk, ESG and sustainable-AI roles and consulting"). The
      build writes "Open to " before it, in the hero's line and in the
      closing call to action on every other page. The homepage's Contact
      section says the same in its own words, written by hand in
      `index.html` ("Open to research collaborations on climate and flood
      risk, water and ESG — based in Pavia, Italy"): if you correct the
      field, correct that line too. Whether consulting may join it is U3.
    - `seniority`: `null` today, and only wanted if you look for work.
    - `availableFrom`: `null` today, likewise. `"now"`, or a date as
      `YYYY-MM` or `YYYY-MM-DD`; the strip shows it as "Now", "Jan 2027" or
      "15 Jan 2027". A past date does not fail the build (`npm test`
      prints a notice), so update it when you check the record (F5).
    - The location line comes from `person.locality` and `person.country`,
      Pavia, IT. The old `workArea` ("EU, remote-friendly") is gone: it
      read as a job search.
  - *Unlocks:* the first view saying, in your words, what you are open to.
    A `null` field is left out of the strip entirely.
  - *Check:* after `npm run build:content`, the strip under the hero shows
    each one, and `npm run build:check` passes.

- [ ] **F4. The Digital Society School role: employment or a programme
  placement, and how big the team was.**
  - *What:* were you employed under the title "Researcher — Sustainable
    Artificial Intelligence" (by the Amsterdam University of Applied
    Sciences, the school's parent), or did you take part in one of the
    school's programmes? How many people were on the team? The answer
    should match the CV you sent IUSS.
  - *Where:* `content/profile.json` → `experience[1]`: its `title`, and the
    team's size if you give it (a figure needs its entry in
    `content/claims.json`, as `team-size` has). The homepage's core log and
    `field-report.html` repeat the title by hand, and the case study's
    `role` is in `content/projects.json` → `sustainable-ai`. Until you say,
    every page keeps the title and credits the work to the team ("As a
    team, mapped…", "I was part of a team building…").
  - *Unlocks:* a title you can stand behind in an interview, on the site
    and on the CV it prints.
  - *Check:* `npm test` names a page that disagrees with the profile; then
    `npm run cv`.

- [ ] **F5. Confirm the record once the PhD has begun.** (Phase 3.10; its
  first question, whether the Digital Society School role was still
  current, was answered on 2026-10-28)
  - *Why ask:* the site's one open-ended fact is now the PhD, "Nov 2026 —
    Present". The question this item used to ask is settled: the Digital
    Society School role ended in February 2026, and every page now says
    so. What only you can do is say, once you have started at IUSS, that
    the record holds.
  - *Where:* `content/profile.json` → `meta.confirmedOn` (now `null`): set
    it to the day you confirm, on or after your first day at IUSS.
    `confirmedOn` is yours alone: it is your word that the facts still
    hold, and nobody else sets it. `meta.verifiedOn` is `2026-11-02`, set
    by the update as the day the record is logged as of (U1); move it with
    `confirmedOn` whenever you re-check the facts. If the start date
    moves, U1 lists what changes with it. When the PhD ends, its end month
    goes in `currentRole` and `experience[0]`, `inProgress` comes off
    `education[0]`, and the research page's "Now researching" block
    (`content/research.json` → `now`) comes out: the build refuses the
    block once no degree is in progress.
  - *Then:* `npm run build:content`, then `npm run cv`, and commit
    `content/profile.json`, `index.html`, `assets/Moses_Kolleh_Sesay_CV.pdf`
    and `assets/cv.hash` together. The day in `meta.verifiedOn` is also the
    surface of the core log: every layer's depth is measured from it, and
    its head reads "LOGGED" and that month (now "LOGGED NOV 2026"). Once
    `confirmedOn` is set, the CV ends "Facts last confirmed" and that day;
    until then it makes no such claim. `tests/cv.test.js` fails until the
    CV is printed again.
  - *Unlocks:* the one open-ended fact on the site stays true. The weekly
    health issue asks for a re-verification once `meta.verifiedOn` is more
    than a quarter old (from 2027-02-01 as it stands), and `npm test`
    prints a notice once it is more than six months old (from early May
    2027).
  - *Check:* `npm test` passes and prints no staleness notice; the core
    log's head shows the month you set.

---

## Evidence behind figures and claims the site dropped, softened or cannot source

- [ ] **E1. The 70%: how many holes, how many struck water, and what
  counted as a strike.**
  - *What:* in the Team & Team International fieldwork of 2019, how many
    boreholes were drilled at sites selected by resistivity survey, how
    many struck water, and what yield counted as a strike. Were they in
    the Freetown Complex, and were they sited from your dissertation's
    maps, or with its method elsewhere in Sierra Leone? Did the
    dissertation itself drill anything?
  - *Why:* the site now gives the 70% one meaning everywhere, "70% success
    rate in later drilling at survey-selected sites", from field records,
    not a controlled trial. Its defaults: the survey method, not the maps;
    the number of holes not recorded. The ~30% rate for drilling blind,
    which this item used to ask a source for, is gone: no record gave it,
    so the Seven in Ten game no longer sets the 70% against it, and its
    ledger entry (`blind-siting`) was deleted.
  - *Where:* `content/projects.json` → `groundwater` → `results[0].basis`
    (it says the number of holes and the yield "are not recorded here"),
    and `content/claims.json` → `strike-rate`, whose basis is that result.
  - *Unlocks:* the 70% with its denominator.
  - *Check:* the basis names the count and the definition, and `npm test`
    passes.

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
  - *Where:* `content/profile.json` → `experience[5]` (Operations Supervisor,
    Sierra Drilling) and `experience[4]` (Field Operations Manager, Team &
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
    Masterschool training. It is off `field-report.html`'s skills line and
    the CV too.
  - *Where:* the evidence goes in `content/research.json` (an output) or on
    the education entry it belongs to; then the homepage toolkit can link it.
  - *Unlocks:* Power BI back in the toolkit, on the field report's skills
    line and on the CV. `tests/content.test.js` fails if the field report
    names a tool the homepage does not show, so the two go back together.
  - *Check:* the toolkit's Power BI proof links somewhere that shows it.

- [ ] **E5. Was the Trinidad and Tobago factsheet published?**
  - *Why:* the old CV said it "directly informed national policy", and the
    site said "produced for national policy use". Neither had a record
    behind it. The site now calls it "a disaster and climate-risk factsheet
    for Trinidad and Tobago", written during the internship and held by
    UNDRR, and says no more; `tests/content.test.js` and `tests/cv.test.js`
    refuse "for national policy use".
  - *What:* if UNDRR published it, its address; and, if anything shows it
    was used in national policy, that.
  - *Where:* `content/projects.json` → `un-disaster` → the factsheet
    artifact (`status`, `url`, `note`), and `content/research.json` →
    `undrr-tt-factsheet`. A new host goes in `TRUSTED_HOSTS` in
    `scripts/lib/content.js` once someone has opened the link.
  - *Check:* the artifact links the factsheet, and `npm test` passes.

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

- [ ] **E7. UNDRR's catalogue counts, for the coverage gain the site
  dropped.**
  - *What:* the catalogue's counts before and after your internship, how
    many of the 54 systems were new, and whether the 25% was a share of
    systems, regions or hazard types.
  - *Why:* "regional and hazard-type coverage expanded by 25%" did not
    close: its basis could not say what was counted. The site now keeps
    "54 documented" and nothing more. The gain is off every page and the
    CV, its ledger entry (`coverage-gain`) is deleted, and
    `tests/content.test.js` and `tests/cv.test.js` refuse it.
  - *Where:* `content/projects.json` → `un-disaster` → a new result with its
    `basis`; an entry in `content/claims.json`; the two guards relaxed in
    the same commit.
  - *Check:* `npm test` passes with the figure and its basis back.

- [ ] **E8. A document for "top of class".**
  - *What:* a transcript, prize letter or class-rank letter that says you
    ranked first in Geology at the University of Sierra Leone; and whether
    "First Class" is the degree's classification, not the dissertation's
    mark.
  - *Why:* the site said "graduated top of class" in several places, with
    nothing behind it. It now says "First Class Honours" alone, as the
    degree's classification (`content/profile.json` →
    `education[3].classification`), and `tests/content.test.js` refuses
    "top of class".
  - *Where:* the BSc's entry in `content/profile.json`, the pages that
    describe the degree, and the guard relaxed in the same commit.
  - *Check:* `npm test` passes, and the page says where the document is.

- [ ] **E9. Receipts for the four skills taken off: LCA, carbon markets,
  circular economy and SASB.**
  - *What:* where you learned each (a course module, the CFI programme, a
    project or a certificate), and something a reader can check.
  - *Why:* the Skills section says every tool comes with the receipt of
    where it earned its place, and these four had none. They are off the
    homepage, the field report and the CV, and `tests/content.test.js` and
    `tests/cv.test.js` refuse them.
  - *Where:* the homepage's Skills lists in `index.html`, by hand; the field
    report's toolkit; the two guards. Then `npm run cv`.
  - *Check:* `npm test` passes, and each skill points at its receipt.

- [ ] **E10. Whose output the 164 water points are.**
  - *What:* were the 100 hand-dug wells and the 50 boreholes delivered by
    the team you supervised at Sierra Drilling while you were there, or are
    they the company's totals for that period? And the 14 solar-powered
    boreholes at Team & Team International? Which record holds each?
  - *Why:* the counts now sit on the jobs that delivered them, not on the
    BSc dissertation, and the site credits the 100 and the 50 to "the team
    I supervised", its default.
  - *Where:* `content/profile.json` → `experience[5].wellsRehabilitated`,
    `experience[5].boreholesConstructed` and `experience[4].solarBoreholes`;
    their units and notes in `content/claims.json` (`wells-rehabilitated`,
    `boreholes-constructed` and `solar-boreholes`; `water-points` is their
    sum).
  - *Check:* each unit says whose output it is, and `npm test` passes.

- [ ] **E11. Where the EcoPrompt Coach's per-token figures came from.**
  - *What:* which version of Jegham et al. (2025, arXiv:2505.09598), which
    table and which prompt and answer configuration each model's figure per
    1,000 tokens comes from, how you converted it, and whether each [low,
    high] range is yours. The site now says, as its default, that the
    figures are "my own conversion of them, at a 50/50 input:output mix,
    and the ranges my own judgement", and that the 2–8× weight of an output
    token is your judgement, since no published source gives it. While you
    are there, two sources to confirm: the "Industry typical (~1.8 L/kWh)"
    water figure, cited to the Uptime Institute (2023), which may be from
    LBNL's 2016 report (Shehabi et al.); and the title of the Sustainable
    Web Design model v3 page, cited as "Estimating Digital Emissions",
    which may have been "Calculating Digital Emissions".
  - *Where:* `ai-carbon-data.js`: `SOURCES.jegham2025`, `SOURCES.own`, each
    model's note, the water-use entries and `SOURCES.swd2023`.
  - *Check:* each figure matches the version you name, before
    `REVIEWED_ON` next moves; `npm test` (`tests/carbon.test.js`) passes.

- [ ] **E12. The month and device for the median page weight.**
  - *What:* the HTTP Archive's page-weight report, read again: the month and
    device (desktop or mobile) the ≈2.5 MB median is for, or the new median
    if it has moved.
  - *Where:* `content/claims.json` → `median-page` (its basis says the month
    and device are not recorded), and `MEDIAN_PAGE_MB` in `script.js`; the
    two change together.
  - *Check:* `npm test` passes.

---

## Confirm what the site now says

Wave 1 recorded these where the tests can hold the pages to them, and the
PhD update added K7 to K11. Each is already on the site; confirm it or give
the right value.

- [ ] **K1. Wageningen: "Average grade 7.8/10", and the specialisation.**
  The site now says "Average grade 7.8/10 (Dutch scale)", not "GPA", and
  names the specialisation "Human-Environment Interaction · Water Systems &
  Global Change" everywhere (it was not on the 2025 CV). Confirm the
  transcript's label for the 7.8 (a weighted average grade, not the
  thesis's), and whether that is the specialisation your diploma supplement
  names, or whether its second half is the chair group.
  `content/profile.json` → `education[1].grade` and
  `education[1].specialisation`.
- [ ] **K2. Sierra Drilling team of 23 and the 8-week OnePointFive programme.**
  `content/profile.json` → `experience[5].teamSize` and
  `experience[2].programmeWeeks`.
- [ ] **K3. Wuppertal: your own part, and what the team delivered.** The
  case study's role says "Interdisciplinary team of six", which is not a
  role, and the CV claims nothing either way. Until you say, every page
  says "Worked in a six-person interdisciplinary team": the field report,
  the case study's `role`, and `content/projects.json` → `wuppertal` →
  `method[0]`. Say what your own part was, and whether you formally led the
  team; if you did, all three can say so again. Also: did the municipality
  commission the work (the case keeps "the problem the municipality handed
  us" and the partner line)? Did the report cost its measures? The case no
  longer calls them cost-effective. And is there a source for the July 2021
  peak of the Wupper near the Schwebebahn (a Wupperverband gauge, or the
  report)? Without one, the flood drawing shows stages, not metres, and no
  dated line.
- [ ] **K4. Thesis periods.** The site now uses, everywhere: coastal thesis
  2023–2024 (Wageningen) and soft-path thesis 2020–2021 (Hunan, defended May
  2021). `content/projects.json` → `coastal.period` and
  `water-management.period`.

- [ ] **K5. Whose report the AI footprint is on.** Anatomy of a Prompt now
  says its Scope 2 and Scope 3 (capital goods) lines are those of whoever
  runs the model, and that an organisation buying answers from a hosted
  model reports the carbon as Scope 3, category 1 (purchased services). The
  Digital Society School project is still described as having mapped
  "Scope 2 electricity, Scope 3 hardware, and data-centre water", as a team
  (`content/projects.json` → `sustainable-ai` → `method[0]`, the homepage's
  core log, the field report). If the government partner's own boundary was
  the hosted-service one, say so and those lines can name it.

- [ ] **K6. The soft-path thesis title.** The site now spells it one way
  everywhere: "Approach to soft path water management: thinking beyond
  cement, steel and pipes — Freetown as case study" (`content/research.json`,
  and in `content/projects.json` → `water-management` the artifact and the
  defence photo's caption, which said "Approach for"). If the title on the
  thesis is different, change all three.

- [ ] **K7. The scholarships' exact names.** The site now names each one way:
  "Chinese Government (MOFCOM) Scholarship" for Hunan and "Wageningen
  African Scholarship Programme" for Wageningen (`content/profile.json` →
  `education[2].scholarship` and `education[1].scholarship`), and
  `npm test` holds every page to them. If your award letters say otherwise,
  change the field, and `npm test` names the pages that still disagree.
- [ ] **K8. MARINA-Multi: did you run it, or analyse its output?** The site
  now credits the model to Wageningen's Water Systems & Global Change group
  and says the thesis "analysed" river pollution with it, never "modelled".
  Say whether you ran MARINA-Multi yourself or analysed runs the group had
  already produced, which MARINA-Multi reference the thesis cites, and
  whether you used its SSP-RCP scenario runs; if you did, "Framed the
  storylines within climate-change scenarios" can say so.
  `content/projects.json` → `coastal` (`method`, `results`), the
  `sub-basins` entry in `content/claims.json`, the Wageningen journey stop
  in `index.html` and entry [3] of `field-report.html`.
- [ ] **K9. The Hunan conference-table photo.** Its caption said
  "representing graduate researchers"; it now says "At a conference table at
  Hunan University". Confirm it, or say what the meeting was.
  `content/projects.json` → `water-management` → that photo's `caption` and
  `fullCaption`.
- [ ] **K10. The BSc dissertation: examined, or defended too?** The site now
  counts "two MSc theses examined and defended, and a BSc dissertation
  examined". If the dissertation was defended orally, say so, and the
  `$comment` lines in `content/projects.json` and `content/research.json`
  and the README can say three were defended.
- [ ] **K11. Was the UNDRR internship part of the Wageningen MSc?** The
  journey puts Bonn (2023) before Wageningen (2021–2024), ordered by the
  year each stop ended, and does not say whether the internship was the
  MSc's. If it was, the Bonn stop (`index.html`, by hand) and the
  internship's entry (`content/profile.json` → `experience[3]`) can say so.

*Check for K1, K2, K4, K6 and K7:* change the value in `content/`, run
`npm run build:content`, and `npm test` names every page that still disagrees.
K3, K8 and K9 have no test behind them: the pages they name are changed
together, by hand. K1's and K2's figures are also in the claims ledger since
wave 4; N1 and N2 ask for the evidence behind them.

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
    Then `npm run build:content`. Whether the people in them agreed to
    appear is U6.
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
    takes it past its length ceiling (11.56 screens measured, 11.85
    allowed), and a reader who only scrolls would fetch up to 2.2 MB of
    photos. Something of equal length would have to come off the page
    first, since ceilings are not raised.
  - *Check:* nothing to check while they stay folded. Opened, each case
    study shows its photos without a press, and `npm run smoke` passes its
    length check once something of equal length has gone.

---

## Confirm the ESG case and the findings (Phase 3.2 and 3.3, wave 4)

Wave 4 added a seventh case study, GAIA, behind a new ESG & CSRD lens, and
a "Findings & recommendations" stage to every case study. Each sentence is
drawn from the GAIA repository or from what the site already said.

- [ ] **G1. Where GAIA and promptcoach began, and whether the Digital
  Society School agreed to their release.**
  - *What:* the sustainable-AI case study lists its "Sustainability
    assessment framework for AI use cases" as held by the Digital Society
    School and its government partner ("not mine to publish
    unilaterally"). GAIA, public under your own MIT licence, answers a
    related question; promptcoach is "Version 2 of the Digital Society
    School prototype", and holds the school's EcoPrompt Coach handover
    document, dated January 2026, in its `docs/legacy/`. Say whether GAIA
    is derived from the school's prototype or framework, and whether the
    school agreed to the MIT release of GAIA and promptcoach and to the
    handover document being public.
  - *Where:* `content/projects.json` → `gaia` and `sustainable-ai` →
    `artifacts`. With your answer, the GAIA case can carry a line on where
    it began. The release and the handover document are settled in those
    two repositories, not here.
  - *Why it matters:* the notes this site was built from say GAIA began as
    "Prototype E" in the prototype deck of the school's project with its
    government partner, so a reader who knows both could take the public
    one for the held one. GAIA is kept off the sustainable-AI case study's
    artifacts, on its own case only, so that case does not imply the
    answer.
  - *Also:* whether the partner may be named at all is D2.
- [ ] **G2. The GAIA case's own facts, and whether you will keep the tools
  up to date.** Your role, now "Author" (it said "Author and maintainer"),
  its period ("2025 — 2026"), and that the web estimator at
  moseskolleh.github.io/GAIA-Framework-/ is live (it could not be reached
  from where this was built). Will you keep GAIA and promptcoach updated
  during the PhD? The site no longer calls either maintained: promptcoach is
  "the newer tool". GAIA has no tags, so the ledger's links for its figures
  now point at commit `f039e73`, where its roadmap says version 2.2.0; tag
  it `v2.2.0` if you like, and `gaia-modelled` and `gaia-models` in
  `content/claims.json` can point at the tag. `content/projects.json` →
  `gaia`.
- [ ] **G3. The findings.** Confirm each, and say more where you can. The
  plan names three that the site does not yet state:
  - which socioeconomic drivers dominated in the coastal thesis (and their
    effect sizes, if the thesis can be cited). Today the coastal finding says
    only that the thesis sets them out;
  - which interventions the Wuppertal report recommended (if the
    municipality agrees). Today the Wuppertal case has no recommendation:
    one that named no measure came off;
  - the decision criteria the sustainable-AI framework gives its government
    partner, if the framework, which the client holds, may be quoted and the
    partner may be named (D2). Today the case gives the five design
    principles instead.
  `content/projects.json` → `caseStudies[i].findings`; one to four each,
  and `npm test` refuses a figure without a basis.
- [ ] **G4. The method, folded.** Each case study's method now opens on a
  press ("02 Method, four steps"), to make room for the findings and the
  seventh case under the page's length ceiling. Open, the seven methods add
  about 3.3 screens on a phone and 1.2 on a desktop, past the ceiling, so
  something of equal length would have to come off first. For the same
  reason the page's closing note, "Why it is laid out like this", keeps its
  heading and folds its two paragraphs. Today the page is 11.56 screens at
  1440×900 and 19.42 at 390×844, against ceilings of 11.85 and 19.78.
  - *Where:* to show the methods open, `renderCaseStudies` in
    `scripts/build-content.js`; then `npm run build:content`, and
    `npm run smoke` says whether the page still fits.

---

## Your public repositories and theses, as the site shows them (Phase 3.1 and 3.4, wave 4)

Wave 4 put your six public repositories on the site, each described only as
far as the repository itself shows: WaterProject, GAIA-Framework-,
climatematch-pipeline, A-B-Testing-at-Globox, SustainableAIPrototypes and
promptcoach (`content/research.json`, and as artifacts in
`content/projects.json`). The homepage toolkit's proof links point at them.
The coach has one name, EcoPrompt Coach, and the site links its newer app,
promptcoach, as a separate tool with its own method. These are the
questions only you can answer, and one about the theses (R8).

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
    newer version. It could not be reached from where this was built.
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
- [ ] **R8. The theses: deposit them, or confirm you can send them.**
  - *What:* the two MSc theses and the BSc dissertation are listed as "on
    request" ("ask and I will send it"). Is the Wageningen thesis in WUR's
    library, and does it carry a clause that needs the chair group's
    consent to share it? Is the Hunan thesis in CNKI or Hunan University's
    library? Would you, with your former supervisors' agreement, deposit
    them on Zenodo, each with a DOI? If none of these, confirm that you can
    send each one when asked.
  - *Where:* `content/research.json` (each thesis's `status`, `url` and
    `note`) and the thesis artifacts in `content/projects.json`. A deposit
    needs `zenodo.org` (and `doi.org`) in `TRUSTED_HOSTS` in
    `scripts/lib/content.js`, and the sentence saying no entry has a DOI
    (the research page's key, in `scripts/build-content.js`, and the
    README) rewritten. Where sharing needs consent, the note says so ("with
    the chair group's consent").
  - *Check:* `npm test` passes, and `research.html` says where each thesis
    is.

---

## The claims ledger: figures only you can evidence (Phase 3.6, wave 4)

`content/claims.json` now holds every figure the site prints, with its one
basis and whether a reader can check it: public (with where), on request, or
not checkable from outside. [`claims.html`](../claims.html), "Check my
numbers", lists them all. Some of those labels are promises only you can
keep, and some figures could move to "public" with a link only you have.

- [ ] **N1. Will you send the evidence for the four "on request" figures?**
  The two master's degrees, the three continents, the five countries and the
  Wageningen average grade of 7.8/10 (K1) are marked on request, on the
  understanding that you will send the degree certificates, the transcript
  and, for Italy, your PhD enrolment when a reader asks. For Germany, one of
  the five countries, the evidence is the UNDRR internship, as you record
  it, not a degree: say if you hold a document for it.
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
    `wuppertal-team` (from `education[1].consultancyTeamSize` in
    `content/profile.json`) and `undrr-months` (counted from the
    internship's dates; the build fails if the two disagree). Confirm both;
  - the 164 water points, now the sum of three counts held on the jobs
    that delivered them (E10): `content/claims.json` →
    `wells-rehabilitated`, `boreholes-constructed` and `solar-boreholes`,
    each with its own `checkable`;
  - the 70% success rate (E1), from the field records: a result of the
    groundwater case study, so its checkability is set there, in
    `content/projects.json` → `groundwater` → `results[0].verifiable`
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
  check them.** The coastal case's count of sub-basins (now "10,226
  sub-basins analysed with MARINA-Multi", K8) and the soft-path case's
  "Successfully defended at Hunan University, May 2021" said "Checkable
  from outside" on the homepage cards, the case studies and the CV, while
  the site cited no source for the count, and `claims.html` filed the same
  degree certificate under "on request". Both now say "not checkable from
  outside".
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
    tests fail if it falls behind. Since the PhD update it opens with the
    PhD, closes the Digital Society School role in February 2026, and links
    your ORCID iD. Two things on the old one are not on it: the Digital
    Society School's partner, by name (D2), and the relevant courses under
    each degree, which the site does not list. Your phone number is on it,
    because the homepage's contact card publishes it; it is `person.phone`
    in `content/profile.json`, and a test holds the homepage to it.
  - *Where:* anything you want on it goes on the site first (`content/profile.json`
    or the homepage), then `npm run cv`. If you would rather not publish the
    phone number, take it off both: the contact card in `index.html` and
    `person.phone`.
  - *Check:* `npm test` passes (`tests/cv.test.js`), and the PDF reads as you
    would want IUSS, or a collaborator, to read it. Copies you sent before
    it are U7.
- [ ] **D2. May the site and the CV name the Digital Society School's
  government partner?**
  - *Why:* the plan says partner names stay out without their consent. The
    site named the ministry from before this plan until the PhD update,
    which applied the default: no consent is recorded, so no name.
    Everywhere it was named (the EcoPrompt Coach page's hero tag, the
    sustainable-AI case study's partner and its held framework, the
    sustainable-AI lens, the homepage's core log, Note 03 and the feed,
    the field report and the field terminal) now says "a Dutch government
    partner" or "its government partner", and `tests/content.test.js`
    fails if the name comes back. The CV names no partner at all
    (`tests/cv.test.js`).
  - *Off the site:* the `SustainableAIPrototypes` repository's README is
    titled for the ministry's initiative, and the `promptcoach` README
    names the ministry's partners; the site links both. Only you can
    change those.
  - *Where:* tell us yes or no. Yes, with the ministry's agreement in
    writing: the name goes back in `content/profile.json` →
    `experience[1].partner` (its `$partner` note says why it is not there
    now), in `content/projects.json` → `sustainable-ai`, the lens and the
    pages above, and the guard in `tests/content.test.js` comes off in the
    same commit. No: nothing on the site changes, and the two READMEs are
    yours to change.
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
- [ ] **D4. Climatematch Academy: completed, and when?**
  - *What:* the climatematch-pipeline output says it was built for a
    Climatematch Academy course, but neither your certificates nor your
    education list it. Which course and year, and do you hold a completion
    certificate?
  - *Where:* only with a certificate: `content/profile.json` →
    `certifications`, a new entry (`name`, `issuer`, `displayDate`, `year`,
    `covered`, and a `verifyUrl` if there is one), and the field report's
    certificates (`npm test` holds each to `name — issuer, year`). Then
    `npm run build:content` and `npm run cv`.
  - *Check:* `npm test` passes, and the CV lists it.
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
  - *Room:* none, at full length. The homepage is 9.70 of its 9.74 screens
    at 1440×900 and 16.83 of 17.03 at 390×844. Measured in wave 4, one
    stand-in quote of 200 characters added about 0.38 of a desktop screen
    and 0.40 of a phone screen, so before the first goes in, about a third
    of a desktop screen and a fifth of a phone screen has to come off the
    homepage; shorter quotes cost less. `npm run smoke` measures it and
    fails a page over its ceiling, which only moves down.
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
  `links` has none, so the structured data lists GitHub, LinkedIn and, since
  the PhD update, ORCID. If you use one and want it there, add its address
  as `links.x` and say so; `personLd` in `scripts/build-content.js` takes
  one line to list it. If not, tick this as "none".

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
  - *The partner:* note 3 named the ministry, as the homepage's note always
    had; since the PhD update it says "a Dutch government partner" (D2).
    The corrections made to all three notes in October 2026 are U8.
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
- [ ] **L4. A second-language edition, only if you want one** (Phase 5.6).
  The plan's Dutch pages were for a job search in Amsterdam; none was
  built, and none is planned now. If you want one, in Dutch or Italian, it
  needs a native speaker's review before it goes live, and it has to state
  your real level in that language (F1). If not, tick this as "none".
