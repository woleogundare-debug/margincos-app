# MarginCOS — Coworker Brief
**Project:** MarginCOS dashboard (Margin Command & Optimisation System)
**Handover from:** Design
**Handover to:** Engineering / next designer
**Status:** Hi-fi clickable prototype, ready for production wiring + data integration
**Last updated:** Apr 26 2026
---
## 1. Context — what this is
MarginCOS is a Naira-denominated margin-recovery dashboard for a Nigerian FMCG portfolio. The dashboard organises commercial decisions into **four pillars** (P1 Pricing, P2 Cost, P3 Channel, P4 Trade) and exposes both portfolio-level health and pillar-level deep-dives.
The prototype is built as a static multi-page HTML app under `handoff/`. Each page is a single React-via-Babel JSX file mounted into an HTML host. There is no build step — open any `.html` file in a browser and it runs.
**Design grammar (consistent across all pages):**
- McKinsey/BCG editorial document feel — numbered exhibits, headline insights, KPI cards with sparklines, source lines, analyst commentary blocks, doc footers
- Two display fonts: **Playfair Display** (numbers + headings) and **DM Sans** (UI text + small labels)
- Naira-led KPIs (₦ symbol always wrapped in `<span class="ng">` — see Gotchas)
- Single shared sidebar nav, single shared CSS file, single shared Tweaks framework
---
## 2. File structure
```
handoff/
├── README.md                ← original design system / token doc
├── HANDOVER.md              ← (this file)
├── shared/
│   ├── margincos.css        ← all design tokens, layout primitives, components
│   ├── sidebar.jsx          ← shared left nav (active="<page>" prop drives highlight)
│   └── tweaks-panel.jsx     ← Tweaks framework — DO NOT modify per page
├── pages/
│   ├── portfolio.jsx        ← entry / landing page
│   ├── overview.jsx         ← redesigned executive overview
│   ├── actions.jsx          ← actions queue
│   ├── pricing.jsx          ← P1 deep-dive
│   ├── cost.jsx             ← P2 deep-dive
│   ├── channel.jsx          ← P3 deep-dive
│   ├── trade.jsx            ← P4 deep-dive
│   ├── enterprise.jsx       ← original Enterprise Modules page
│   ├── enterprise-a.jsx     ← Option A (compact list)
│   ├── enterprise-b.jsx     ← Option B (sectioned + featured)
│   └── team.jsx             ← team management
├── portfolio.html
├── overview.html
├── actions.html
├── pricing.html
├── cost.html
├── channel.html
├── trade.html
├── enterprise.html          ← original
├── enterprise-a.html        ← Option A host
├── enterprise-b.html        ← Option B host
└── team.html
```
**Architecture rules:**
- One `.jsx` file per page, mounted via one `.html` host
- All HTML hosts load the same three shared scripts in this order: `tweaks-panel.jsx` → `sidebar.jsx` → `pages/<page>.jsx`
- All design tokens (color, type, spacing, radius, shadows) live in CSS variables in `shared/margincos.css`
- Page-specific styles live inline at the bottom of each `.jsx` file inside a `<style>` block
---
## 3. What needs deciding (blockers)
These are the open questions that will shape the work below. Get answers before starting.
| # | Question | Who decides | Default if no answer |
|---|---|---|---|
| 1 | **Enterprise page — A or B (or hybrid)?** Two options exist; one needs to win. | Product / design lead | Keep both, expose via toggle in Tweaks |
| 2 | **Real module data** — current 6 modules are placeholders | Product owner | Ship with placeholders, add `TODO: real data` comments |
| 3 | **Naira run-rate figures across the dashboard** — all hardcoded | Finance / data team | Leave hardcoded, flag in `<!-- placeholder -->` comments |
| 4 | **CTA destinations** — "Open →", "Catalogue", "Request access", "Notify me" all non-functional | Product owner | Wire to `#` placeholders + console.log for now |
| 5 | **Auth / role gating** — does Enterprise page need access control? | Product / engineering | Assume open access in prototype |
---
## 4. Required adjustments
### 4.1 Pick the Enterprise option (highest priority)
Compare `enterprise-a.html` vs `enterprise-b.html` against the original `enterprise.html`.
**Option A** — compact spec-sheet list. All 6 modules in a dense table-like layout with status filter in Tweaks. Best for power users.
**Option B** — featured hero band (top 2 modules) + categorised sections. Best for browsing / discovery.
**Once a winner is chosen:**
1. Rename the chosen file to replace the original: `mv enterprise-a.html enterprise.html` (and same for the `.jsx`)
2. Delete the losing option's `.html` and `.jsx` files
3. Unregister the losing option from the asset review pane (or leave; harmless)
### 4.2 Replace placeholder data
Each page has its data near the top of the `.jsx` file as a JS array or object literal. Examples:
- `pages/enterprise-a.jsx` — `MODULES` array (line ~5)
- `pages/portfolio.jsx` — pillar data, KPI rows
- `pages/actions.jsx` — `ACTIONS` array
- `pages/pricing.jsx` — SKU table data
**Action:** replace these with API fetches. Suggested pattern:
```jsx
const [modules, setModules] = React.useState(null);
React.useEffect(() => {
  fetch('/api/modules').then(r => r.json()).then(setModules);
}, []);
if (!modules) return <LoadingState />;
```
### 4.3 Wire the CTAs
Search every `.jsx` for `<button className="btn"` and `<a className="btn"` — none of them currently navigate or mutate. Map each to:
- A real route (sidebar links use `<a href="...">`)
- A real action handler (open modal, fire API call, etc.)
### 4.4 Add the Enterprise option(s) to the sidebar
`shared/sidebar.jsx` currently has one "Enterprise Modules" entry. If keeping both A and B as live routes, add a second nav item or a sub-menu. If picking one, no sidebar change needed (just rename the file).
### 4.5 Strip Tweaks for production
The Tweaks panel is a design-iteration tool, not a user-facing feature. To remove for production:
For each page `.jsx`:
1. Delete the `<TweaksPanel>` block at the bottom
2. Remove the `useTweaks(...)` hook call (replace with literal default values)
3. Strip the `/*EDITMODE-BEGIN*/ … /*EDITMODE-END*/` comment markers and inline the JSON object as a plain const
For each `.html` host:
4. Remove the `<script type="text/babel" src="shared/tweaks-panel.jsx"></script>` line
You can leave `shared/tweaks-panel.jsx` in the repo; it just won't be loaded.
### 4.6 Convert to a real build
Currently uses `@babel/standalone` in the browser (slow, dev-only). For production:
- Move to Vite + React or Next.js
- Each `pages/*.jsx` becomes a route
- `shared/margincos.css` stays as global CSS
- `shared/sidebar.jsx` becomes a layout component
- Drop the `<script type="text/babel">` runtime
---
## 5. Design tokens reference
All defined in `shared/margincos.css` — modify there, not in page files.
```css
--navy: #0a2540          /* Primary text + headings */
--navy-50: #f0f4f9       /* Tinted bg for icons */
--teal: #1f7a8c          /* Brand accent */
--teal-50: #e6f0f2
--gold: #b8860b          /* Beta status, warnings, highlights */
--green: #10654a         /* Live status, positive impact */
--red: #c33                /* Soon status, negative impact, urgency */
--rule: #e6e1d6          /* Hairline borders */
--rule-strong: #d4cdb8   /* Section dividers */
--paper: #faf8f3         /* Subtle bg */
--paper-2: #f1ede1       /* Code chip bg */
--text: #2a2a2a
--text-light: #5a5a5a
--gray: #8a8a8a
--r-sm: 4px              /* Small radius — pills, buttons */
--r-md: 8px              /* Card radius */
/* Type stack */
font-family: 'Playfair Display', Georgia, serif;  /* Numbers, h1-h4 */
font-family: 'DM Sans', sans-serif;                /* UI text, labels */
font-family: 'JetBrains Mono', monospace;          /* Pillar codes, IDs */
```
---
## 6. Gotchas — read before editing
### 6.1 Naira symbol
Playfair Display does **not** include the Naira symbol. We wrap every Naira symbol in `<span class="ng">₦</span>` which forces DM Sans for that single character via CSS. **If you remove the wrapper, you will see hex codes or a tofu box.** DM Sans's glyph has a stylised double-stroke through the N — this is the typeface design, not a bug.
### 6.2 Style object naming
Each page file may define a styles object. **It must have a unique name** (e.g. `enterpriseStyles`, not `styles`). Babel-in-browser shares scope across `<script type="text/babel">` tags, so two files both defining `const styles = {}` will collide and break.
### 6.3 EDITMODE block must be valid JSON
The Tweaks framework rewrites the `/*EDITMODE-BEGIN*/{...}/*EDITMODE-END*/` block on disk when users change Tweaks. The content between markers must be **valid JSON** — double-quoted keys, no trailing commas, no JS comments inside. If you break this, the host fails silently.
### 6.4 Sidebar mobile collapse is per-page
Each page `.jsx` has its own `@media (max-width: 600px)` block that collapses the sidebar into a top strip. **This is not centralised.** If you change sidebar markup, update every page. (Worth refactoring into `shared/margincos.css` during the production migration.)
### 6.5 Status pills use specific class modifiers
`<span class="status-pill green">` / `amber` / `red`. Adding new statuses (e.g. "deprecated") requires a new modifier class in `margincos.css`.
### 6.6 The `data-screen-label` attr
Every `<main>` has `data-screen-label="..."`. This is consumed by the design tooling for context — leave it in for now, safe to remove in production.
### 6.7 doc-head is responsive
As of last fix, `.doc-head` stacks vertically below 1100px. The title block must stay first child for the layout to work; do not reorder.
---
## 7. Responsiveness checkpoints
When testing or making changes, check at these viewport widths:
| Width | What changes |
|---|---|
| **1400px+** | Full desktop, the design target |
| **1100px** | doc-head stacks vertically, hero cards collapse to single column |
| **800px** | Summary grids collapse to 2 columns, module rows reflow stats below |
| **600px** | Sidebar becomes top strip, summaries go to single column |
| **420px** | Minimum supported width |
---
## 8. Suggested order of work
1. Read this file + `handoff/README.md`
2. Open `portfolio.html` in a browser, click through every sidebar item to see the full prototype
3. Get answers to the blockers in section 3
4. Pick the Enterprise option, delete the loser
5. Replace placeholder data with real API calls (one page at a time, start with `portfolio.jsx`)
6. Wire CTAs
7. Strip Tweaks
8. Migrate to Vite + React for production
---
## 9. Questions / contact
Anything ambiguous, ask before assuming. The two highest-risk areas are:
- **Naira figure accuracy** — these are placeholder; do not ship without finance sign-off
- **Module impact claims** (e.g. "+1.4B run-rate") — these need the data team to validate the methodology
Good luck.
