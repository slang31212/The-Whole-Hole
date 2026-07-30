# Internal Consistency Audit — "A Breakthrough in Semi-Submersible Design" (A.C. Lang, Seaways Engineering, 1988)

*36-page scanned report on the Multi-Purpose Semi-Submersible (MPSS). Every page was rendered to an image and read directly, because the PDF has no text layer and the key numbers live in engineering drawings, data tables, and hand-plotted figures. Page references use the document's own printed page numbers; figures are cited by their figure number.*

---

## Verdict

**Internally consistent on its core engineering data, with one material self-contradiction in the intact-stability summary and one minor numeric discrepancy.** The report holds up remarkably well under cross-checking: the operating displacement, draught, damage-stability behaviour, fatigue life, wave statistics, and environmental-load totals all reconcile — several of them across three independent figures, and several by arithmetic that lands exactly on the stated totals. The one place the document clearly disagrees with itself is a single sentence in Section 4 (Stability, p.5), which describes the operating condition as **"10,000 tonnes at elevation of 62.5 m."** Both numbers are contradicted by the report's own figures: the displacement is **53,095 tonnes** (stated identically in three places), and the centre of gravity is about **26.8 m** (well under the 28.28 m limit) — never 62.5 m, which would sit above the top of the vessel. A reader who trusted that one sentence would walk away with a displacement that is 5× too low and a physically impossible CG. Treat that sentence as an error; the rest of the numbers are trustworthy.

---

## Contradictions Found

### 1. Operating displacement: "10,000 tonnes" vs 53,095 tonnes — **Material**
- **Location A:** p.5, §4 Stability, ¶1 — "the proposed operating configuration, ie. **10,000 tonnes** at elevation of 62.5m, is within the safe operating region."
- **Location B:** Figure 3 (Plan View dimensions table) — "DISPLACEMENT AT OPERATING DRAUGHT **53,095 TONNES**"; Figure 14 (Damaged Equilibrium) — "Displacement **53,095 tonnes**"; Figure 12 (Hydrostatics) — displaced volume 51,750 m³ at 27.5 m draught.
- **The conflict:** The report's figures put the operating displacement at 53,095 tonnes, confirmed three independent ways — the dimensions table, the damaged-equilibrium table, and the hydrostatics table (51,750 m³ × 1.026 t/m³ = 53,095 t, an exact match). The stability sentence on p.5 states 10,000 tonnes, which is **5.3× smaller** than the vessel's actual displacement. Displacement is the single most fundamental number in a stability check, so this is not a place a stray figure can be waved away. The figures agree with each other; the prose sentence is the outlier.

### 2. Centre-of-gravity elevation: "62.5 m" vs ~26.8 m (max allowable 28.28 m) — **Material**
- **Location A:** p.5, §4 Stability, ¶1 — "...10,000 tonnes at **elevation of 62.5 m**, is within the safe operating region defined by Lloyds' Rules."
- **Location B:** Figure 13 (Max VCG limited by wind heeling) — KG max at 27.5 m draught = **28.28 m**; Figure 3 — metacentric height GM = 6.525 m; Figure 12 — KMT 33.315 m at 27.5 m (so actual KG = 33.315 − 6.525 = **26.79 m**).
- **The conflict:** A centre of gravity at 62.5 m is impossible for this vessel — the whole structure is only 56.25 m tall (Figure 3), and the maximum CG the stability figures allow at operating draught is 28.28 m. The vessel's actual CG works out to ~26.8 m, comfortably inside that limit. So the sentence's own conclusion ("within the safe operating region") is only true for the *real* ~26.8 m CG, not for the 62.5 m it quotes. The digits are suspiciously close to the metacentric height of **6.525 m** (Figure 3), so this looks like a transcription slip — but as written, p.5 contradicts Figures 12 and 13.

### 3. Mooring chain length: "some 1,100 metres" vs 1,350 m — **Minor**
- **Location A:** p.9, §11 Offshore Installation, ¶4 — "The chains ... would be **some 1,100 metres** in length."
- **Location B:** Figure 18 (Mooring Line Properties) — "Length of Chain **1350 m**."
- **The conflict:** The prose and the mooring-properties table disagree on chain length by 250 m (about 23%). The word "some" signals an approximation, but 1,100 and 1,350 are too far apart to be the same rounded number. The chain *diameter* in the same sentence (76–120 mm) does contain the figure's 92 mm, so only the length is off. Low impact on the design story, but a reader comparing the two would notice.

### Minor typographical note (not a substantive contradiction)
- Figure 15 lists the 30°/18 m wind-heeling moment as **"1,068.000"** — a period where a comma belongs; the value is 1,068,000 KNm, consistent with the rest of the column. Worth a proof-reading fix, but it doesn't change any result.

---

## Claims That Held Up

The report's load-bearing numbers cross-check cleanly — in several cases the arithmetic lands exactly on the stated total:

- **Operating displacement 53,095 tonnes** — stated identically in Figure 3 and Figure 14, and independently reproduced by Figure 12 (51,750 m³ × 1.026 t/m³ = 53,095 t). Three-way agreement.
- **Damage stability (p.5)** — the "list by approximately 9.5°" claim matches Figure 14 exactly: the resultant of roll 6.74° and pitch 6.69° is √(6.74² + 6.69²) = **9.50°**. The "no downflooding point closer than 16.9 m" matches Figure 14's minimum downflooding distance of **16.94 m**.
- **Minimum fatigue life 58 years (p.3)** — Figure 6 plots the fatigue lives around the joint and the lowest value shown is exactly **58 years, in the pontoon at its connection to the column**, precisely as the text describes.
- **Wave occurrences (Figure 5)** — the eight per-period counts sum to **11,163,029.1**, matching the stated "Total No. of Waves" to the decimal.
- **Extreme environmental loads (Figure 20)** — all three weather-heading columns add up: wind + current + wave-drift = 5,617 / 6,691 / 7,515 kN as stated, and the headings (0°, 22.5°, 45°) match the wave directions listed on p.4.
- **Operating draught 27.5 m** — consistent across the text (p.7, p.10) and Figures 3, 12, and 13.
- **Twelve-line mooring** — the "twelve chain and anchor sets" of p.9 matches the plot titles and layouts of Figures 21 and 22 (lines numbered 1–12); water depth 150 m agrees between p.9 and Figure 18.
- **Materials & scantlings** — BS4360 Grade 50 D steel and the 14 mm shell / 20 mm at connections are stated consistently in the text (p.2, p.3, p.7) and on the Figure 4 scantling drawing.
- **Pontoon depth 7.5 m** — matches between Figure 3 and the SWIS passage on p.10 (which correctly "triples" 7.5 m to 22.5 m).
- **Model scale 1:100** — consistent across p.6, p.7, and Figure 23; the 90 m × 90 m plan dimensions agree between Figure 3 and the 90 cm model base of Figure 23.

---

## Coverage note

One completeness caveat, separate from the contradictions above: the scan's printed page numbering jumps from **10 to 12** — printed page 11 does not appear in the file. This is a gap in the scanned copy rather than an inconsistency in the document's data, but it means a small amount of Section 14/15 text was not available to audit. Everything else (all 36 scanned pages, all 25 figures) was reviewed.
