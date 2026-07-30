---
name: pdf-contradiction-audit
description: >-
  Audit a long, multi-page PDF report for INTERNAL contradictions — places where
  the document disagrees with itself. Use this whenever a user uploads or points
  to a PDF report, whitepaper, financial statement, annual report, pitch deck,
  research paper, or any multi-page document and wants it fact-checked against
  itself: totals that don't add up, percentages that miss 100, numbers in the
  prose that don't match the charts or tables, or the same figure given two
  different values in different sections. Trigger on phrasing like "check this
  report for inconsistencies", "does this document contradict itself", "audit
  this PDF", "do the numbers in here add up", "cross-check the figures", or
  "find where this disagrees with itself" — even when the user doesn't say the
  word "contradiction". This is about a document's consistency with ITSELF, not
  fact-checking against the outside world.
---

# PDF Contradiction Audit

## What this skill is for

The reader of a long report can't hold page 4's revenue figure in their head
while looking at the chart on page 31. You can. The job here is to make a
document accountable to itself: pull out every number, statistic, date, and
factual claim, note exactly where each one lives, and then reconcile them so
that anything the report asserts twice is asserted the same way both times — and
anything it claims in prose matches what its own charts and tables show.

Two things make this work and are easy to skip, so don't:

1. **Read the pages as images, not just as text.** A PDF's text layer omits
   what's inside charts, and often scrambles tables into unusable word-salad. A
   bar that visibly reaches 40 while the caption says 55 is a real
   contradiction, and it's invisible unless you actually look at the page.
2. **Locate everything.** A finding a reader can't verify is close to useless.
   Every extracted value carries its page and its figure/section, so every
   contradiction you report names both places it comes from.

## Workflow

### 1. Turn the PDF into readable pages

Run the bundled script (it lives at `scripts/pdf_to_pages.py` relative to this
skill's directory) to render each page to an image and extract its text:

```bash
python3 <skill_dir>/scripts/pdf_to_pages.py "<input.pdf>" "<work_dir>/pages" --dpi 150
```

It writes `page-001.png` / `page-001.txt` per page plus a `manifest.json` that
flags which pages `likely_has_visuals` (charts, tables, figures). If PyMuPDF is
missing, install it first: `pip install pymupdf`. Bump `--dpi` to 200+ if a page
has dense tables or fine print you can't read cleanly at 150.

### 2. Read every page — text and image together

Go through the document page by page. Read the text file for speed, but **open
the page image for every page the manifest flags as having visuals**, and skim
the image on the rest to catch anything the text layer dropped. Charts, tables,
and figures are where the most interesting contradictions hide, precisely
because most readers never reconcile them against the prose.

### 3. Build the evidence ledger

As you read, record every hard, checkable assertion into a ledger. Save it as a
working file (`<work_dir>/ledger.md` or `.csv`) so the audit itself is
auditable. Capture:

- **Numbers & statistics** — revenue, counts, sizes, rates, growth figures.
- **Percentages** — especially any that belong to a breakdown that should total
  100%.
- **Dates & time spans** — founding years, "over N years", quarter/period labels.
- **Named claims** — "the largest in the region", "doubled year over year",
  rankings, superlatives, causal statements.

For each entry note: the **value as stated**, its **page**, its **location on
the page** (e.g. "Figure 3", "Table 2", "Executive Summary, ¶2", "bar chart
top-right"), and a short quote or description so it's traceable. When a value
appears in more than one place, that's not a duplicate to collapse — those are
exactly the pairs you'll be checking, so keep every occurrence.

### 4. Reconcile — hunt for the ways a document breaks its own promises

Work through these systematically; each is a distinct failure mode:

- **Totals that don't add up.** Sum the components and compare to the stated
  total. Line items vs. their subtotal; segment revenues vs. group revenue;
  a headcount table vs. the "N employees" sentence.
- **Percentages that miss 100.** Any breakdown presented as exhaustive (market
  share, budget allocation, survey responses) should sum to 100% (allow a point
  or so for rounding — call out anything beyond that).
- **Text that doesn't match a chart or table.** Read the value off the visual
  and compare it to what the prose says about that same visual. Watch for the
  axis: "in thousands"/"in millions" labels are a classic place where prose and
  chart silently diverge by 1000×.
- **The same figure, two values, two sections.** A metric stated one way in the
  executive summary and differently in the detail pages — the most common and
  most damaging kind, because each looks fine on its own page.
- **Dates and spans that can't coexist.** "Founded in 2013" alongside "our 20
  years of experience"; timelines whose start and end don't match a stated
  duration.
- **Units and scale drift.** The same quantity in different units (%, bps, $,
  $M) without a clean conversion; per-unit vs. total confusion.

Do the arithmetic explicitly rather than eyeballing it — a total is either right
or wrong, and showing the sum is what makes the finding undeniable. It's fine to
compute sums or check chart readings with a scratch script; that's often faster
and more reliable than doing it in your head.

Hold a finding to a real standard before reporting it. Rounding, an explicitly
labeled restatement ("adjusted for X"), a genuinely different metric that only
looks similar, or a "~" the report itself flagged as approximate are **not**
contradictions. If two numbers differ for a reason the document states, it's
consistent — say so and move on. A false alarm costs you the reader's trust in
the whole audit.

## Output: the audit report

Lead with the verdict — the reader wants the bottom line before the evidence.
Then the contradictions, each fully located and explained, then the claims that
survived scrutiny so the reader knows what they *can* rely on. Use this
structure:

```markdown
# Internal Consistency Audit — <report title / filename>

## Verdict
<2–4 sentences: the bottom line. How many contradictions surfaced and how
serious, whether they undermine the report's headline claims, and whether a
reader should trust the document's numbers as they stand. Give it a plain grade
— e.g. "internally consistent", "minor discrepancies only", or "material
contradictions found".>

## Contradictions Found
<Ordered most-serious first. If none, say "No internal contradictions found."
and briefly note what you checked.>

### 1. <short label> — <Critical | Material | Minor>
- **Location A:** p.<X>, <figure/table/section> — states "<value/claim, quoted>"
- **Location B:** p.<Y>, <figure/table/section> — states "<value/claim, quoted>"
- **The conflict:** <plain-language explanation a non-expert gets on one read.
  Show the arithmetic when it's a math failure, e.g. "12 + 19 + 8 = 39, not the
  45 stated in the summary." Name which one (if either) looks correct when you
  can tell.>

### 2. ...

## Claims That Held Up
<A short list of the report's *major* claims you were able to corroborate —
figures that matched across sections, totals that reconciled, a chart that
agreed with its prose. This isn't every consistent number; it's the handful of
load-bearing claims a reader most wants confirmed. Cite the pages that agree.>
- <claim> — consistent across p.<X> and p.<Y> / prose matches chart on p.<Z>.
```

Keep severity honest: **Critical** = a headline/decision-driving number is
wrong or self-contradictory; **Material** = a real discrepancy a careful reader
would want fixed; **Minor** = small stuff (rounding beyond tolerance, a stray
mislabel) that doesn't change the story. The severity is what powers the verdict,
so grade the individual findings before you write the top-line judgment.

For a very long report, work in page batches and keep appending to the ledger
rather than trying to hold the whole document in mind at once — the ledger is
what lets you reconcile page 4 against page 31 without having read them in the
same breath. Offer the ledger as an appendix or separate file if the user wants
to see the full extraction behind the verdict.
