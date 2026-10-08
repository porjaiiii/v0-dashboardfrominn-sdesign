# Graph Report - v0-dashboardfrominn-sdesign  (2026-10-08)

## Corpus Check
- 121 files · ~207,642 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 911 nodes · 2067 edges · 59 communities (50 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c0cc01a3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- waste/dashboard/route.ts
- types.ts
- admin-ui.tsx
- map-data.ts
- waste-records/page.tsx
- DashboardPanels.tsx
- compilerOptions
- policy.ts
- login.test.ts
- mailers.ts
- signup/route.ts
- route-helpers.ts
- users/page.tsx
- design-tokens.ts
- Dashboard login (users + admins) — design
- accounts.ts
- admin-queries.ts
- map/page.tsx
- waste-types/page.tsx
- File Structure
- devDependencies
- contact/page.tsx
- components.json
- auth/login/route.ts
- dependencies
- LandingStats.tsx
- http.ts
- auth-context.tsx
- app/page.tsx
- AnnualWasteChart.tsx
- system-info/page.tsx
- dashboard-queries.ts
- waste-management/page.tsx
- rewards/page.tsx
- sorting/page.tsx
- sections.tsx
- AdminShell.tsx
- ExportCsvDialog.tsx
- email-templates.ts
- supabase-rest.ts
- waste-data/page.tsx
- package.json
- AdminShell
- StatCards.tsx
- MascotBin.tsx
- getSummary
- button.tsx
- v0-dashboardfrominn-sdesign
- postcss.config.mjs
- clsx
- @line/liff
- next.config.mjs
- next-env.d.ts
- next
- shadcn
- tailwind-merge
- tw-animate-css

## God Nodes (most connected - your core abstractions)
1. `fontStyle` - 22 edges
2. `getAccountById()` - 20 edges
3. `isSupabaseConfigured()` - 19 edges
4. `jsonError()` - 18 edges
5. `POST` - 17 edges
6. `compilerOptions` - 16 edges
7. `Dashboard login (users + admins) — design` - 16 edges
8. `ADMIN_COLORS` - 15 edges
9. `ok()` - 15 edges
10. `readBody()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `PointFormulaPage()` --calls--> `useAdminList()`  [EXTRACTED]
  app/admin/point-formula/page.tsx → lib/use-admin-list.ts
- `RewardStockPage()` --calls--> `useAdminList()`  [EXTRACTED]
  app/admin/reward-stock/page.tsx → lib/use-admin-list.ts
- `RewardsPage()` --calls--> `downloadCsv()`  [EXTRACTED]
  app/admin/rewards/page.tsx → components/dashboard/admin-ui.tsx
- `RewardsPage()` --calls--> `useAdminFetch()`  [EXTRACTED]
  app/admin/rewards/page.tsx → lib/use-admin-list.ts
- `toRow()` --calls--> `toBuDate()`  [EXTRACTED]
  app/admin/users/page.tsx → lib/use-admin-list.ts

## Import Cycles
- None detected.

## Communities (59 total, 9 thin omitted)

### Community 0 - "waste/dashboard/route.ts"
Cohesion: 0.08
Nodes (40): POST(), GET(), SUBMISSION_HEADERS, buildNameMap(), buildNameMap(), findCol(), findCol(), GET() (+32 more)

### Community 1 - "types.ts"
Cohesion: 0.06
Nodes (32): MOCK_ADMIN_KEYS, MOCK_COUPONS, MOCK_REWARDS, MOCK_STAFF_USERS, MOCK_USERS, MOCK_WASTE_RECORDS, MOCK_WASTE_SUBTYPES, MOCK_WASTE_TYPES (+24 more)

### Community 2 - "admin-ui.tsx"
Cohesion: 0.09
Nodes (29): Notice, TODO: เปลี่ยนเป็นข้อมูลจริงจาก API/Google Sheets, ROWS, Status, STATUS_COLOR, td, th, PointFormulaPage() (+21 more)

### Community 3 - "map-data.ts"
Cohesion: 0.07
Nodes (26): DonationCard(), DonationCardProps, fontStyle, TYPE_COLORS, TYPE_ICONS, GREY_SEGMENTS, MapWithPins(), MapWithPinsProps (+18 more)

### Community 4 - "waste-records/page.tsx"
Cohesion: 0.13
Nodes (27): COLUMNS, dash(), KEYS, SORT_KEYS, Staff, StaffPage(), toStaff(), AdminUsersPage() (+19 more)

### Community 5 - "DashboardPanels.tsx"
Cohesion: 0.12
Nodes (16): axisTick, ChartPanel(), Co2ChartPanel(), MonthlySummary(), num(), RewardsPanel(), TH_SHORT, Tone (+8 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 7 - "policy.ts"
Cohesion: 0.11
Nodes (24): Ctx, DELETE, ActionPlan, ActionSubject, Allowed, AUTH_PAGES, BAD_ROLE, cleanName() (+16 more)

### Community 8 - "login.test.ts"
Cohesion: 0.19
Nodes (16): fetchMock, withCookie(), signToken(), accountRow(), ADMIN_ID, request(), ROOT_ID, SECRET (+8 more)

### Community 9 - "mailers.ts"
Cohesion: 0.21
Nodes (17): claimEmailSlot(), getRootAccount(), appBaseUrl(), MIN_SECRET_LENGTH, sessionSecret(), link(), notifyRootOfSignup(), sendDecisionEmail() (+9 more)

### Community 10 - "signup/route.ts"
Cohesion: 0.21
Nodes (16): POST, POST, updateAccounts(), passwordError(), signupError(), WEAK_PASSWORD_MESSAGE, AuthApiError, authFetch() (+8 more)

### Community 11 - "route-helpers.ts"
Cohesion: 0.15
Nodes (15): GET, GET, PATCH, GET, PATCH, GET, GET, GET (+7 more)

### Community 12 - "users/page.tsx"
Cohesion: 0.13
Nodes (18): dash(), formatThaiDate(), formatThaiDateTime(), KEYS, Row, SORT_KEYS, SORT_OPTIONS, TAMBON_OPTIONS (+10 more)

### Community 13 - "design-tokens.ts"
Cohesion: 0.16
Nodes (17): MapCardProps, ChartRow, FULL_MONTH_NAMES, matchCategory(), MONTH_NAMES, MonthlyWasteChart(), MonthlyWasteChartProps, WasteRecord (+9 more)

### Community 14 - "Dashboard login (users + admins) — design"
Cohesion: 0.10
Nodes (20): Account lifecycle, API routes, Configuration, Constraints (from the user), Dashboard login (users + admins) — design, `dashboard.transfer_root(p_new_root uuid)`, Database: `supabase/dashboard_schema.sql`, Decisions (+12 more)

### Community 15 - "accounts.ts"
Cohesion: 0.15
Nodes (18): AccountListItem, AccountRow, DASHBOARD_SCHEMA, findOne(), getAccountById(), isUuid(), ACCOUNT_STATUSES, AccountStatus (+10 more)

### Community 16 - "admin-queries.ts"
Cohesion: 0.27
Nodes (20): activeAdmins(), activeCouponCount(), dateRange(), getFormulas(), getRewardStock(), getStaff(), getUsers(), getUsersRaw() (+12 more)

### Community 17 - "map/page.tsx"
Cohesion: 0.15
Nodes (14): fontStyle, BangKachaoMap(), BangKachaoMapProps, SUBDISTRICT_HIGHLIGHTS, TAMBON_KEYS, MenuButton(), rowBase, Sidebar() (+6 more)

### Community 18 - "waste-types/page.tsx"
Cohesion: 0.13
Nodes (17): formatKg(), InsightCard(), InsightCardProps, MONTH_NAMES, TAMBON_LIST_DATA, WasteRecord, YEAR_OPTIONS, axisTickStyle (+9 more)

### Community 19 - "File Structure"
Cohesion: 0.11
Nodes (18): Dashboard Login Implementation Plan, File Structure, Global Constraints, Review Focus, Task 10: Database schema and root-admin scripts, Task 11: Client helpers and auth pages, Task 12: Admin shell and account management page, Task 13: Wire user pages, remove the old login, update config (+10 more)

### Community 20 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, postcss, tailwindcss, @tailwindcss/postcss, @types/node, @types/nodemailer, @types/react, @types/react-dom (+11 more)

### Community 21 - "contact/page.tsx"
Cohesion: 0.17
Nodes (12): metadata, svg, ADDRESS_LINES, COMPANY, EMAIL, HOWTO_VIDEO_EMBED_URL, LINE_OA_URL, LOGIN_HREF (+4 more)

### Community 22 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 23 - "auth/login/route.ts"
Cohesion: 0.32
Nodes (14): PATCH, POST, POST, POST, POST, getAccountByEmail(), field(), ok() (+6 more)

### Community 24 - "dependencies"
Cohesion: 0.12
Nodes (17): @base-ui/react, class-variance-authority, lucide-react, nodemailer, dependencies, @base-ui/react, class-variance-authority, lucide-react (+9 more)

### Community 25 - "LandingStats.tsx"
Cohesion: 0.15
Nodes (13): CLOUDS, EXPLAIN, fmt(), hillHalfWidth(), LandingStats(), layoutTrees(), Placed, PublicStats (+5 more)

### Community 26 - "http.ts"
Cohesion: 0.29
Nodes (13): POST(), GET(), authConfigured(), adminActionRoute(), FOREIGN_ORIGIN_MESSAGE, isSameOrigin(), jsonError(), Need (+5 more)

### Community 27 - "auth-context.tsx"
Cohesion: 0.14
Nodes (11): ibmPlexSansThai, metadata, AuthContext, AuthContextType, AuthProvider(), EmailUser, MOCK_USERS, LiffContext (+3 more)

### Community 28 - "app/page.tsx"
Cohesion: 0.14
Nodes (12): TAMBON, WASTE_TYPES, HeroCarousel(), Hotspot, Slide, SLIDES, BOTTLE, CAN (+4 more)

### Community 29 - "AnnualWasteChart.tsx"
Cohesion: 0.17
Nodes (12): AnnualWasteChart(), getYearBE(), matchCategory(), TYPE_SERIES, WasteRecord, normalise(), SelectOption, SelectPill() (+4 more)

### Community 30 - "system-info/page.tsx"
Cohesion: 0.13
Nodes (8): BUGS, FILES, HINT, INPUT, LABEL, TODO: บันทึกลงฐานข้อมูลจริง, Chevron(), solidBtn

### Community 31 - "dashboard-queries.ts"
Cohesion: 0.25
Nodes (13): GET, aggregate(), buildMock(), getDashboard(), key(), loadFromSupabase(), pct(), TODO: ถ้าข้อมูลมาก ให้สร้าง SQL view/RPC… (+5 more)

### Community 32 - "waste-management/page.tsx"
Cohesion: 0.15
Nodes (8): metadata, metadata, OUTCOMES, STEPS, AboutSection(), SiteFooter(), VideoSection(), SiteNav()

### Community 33 - "rewards/page.tsx"
Cohesion: 0.16
Nodes (11): DONUT_COLORS, n(), outlineSmall, periodOptions(), RewardsPage(), TH_MONTHS, TONE, CsvButton() (+3 more)

### Community 34 - "sorting/page.tsx"
Cohesion: 0.16
Nodes (11): LandingPage(), CATEGORIES, Category, CategoryCard(), iconProps, Item, metadata, STEPS (+3 more)

### Community 35 - "sections.tsx"
Cohesion: 0.21
Nodes (8): ABOUT_STEPS, LINE_STEPS, DEEP, FOREST, Leaf(), LIME, MID, RecycleBadge()

### Community 36 - "AdminShell.tsx"
Cohesion: 0.23
Nodes (9): AdminLoginPage(), safeNext(), AdminSidebar(), GridIcon(), ITEM_HREFS, MENU, MenuGroup, rowBase (+1 more)

### Community 37 - "ExportCsvDialog.tsx"
Cohesion: 0.23
Nodes (10): DateField(), ExportCsvDialog(), ExportRange, formatBe(), pad(), Preset, PRESETS, Props (+2 more)

### Community 38 - "email-templates.ts"
Cohesion: 0.33
Nodes (10): ROLE_LABELS, approvedMail(), compose(), escapeHtml(), HTML_ESCAPES, MailMessage, newSignupMail(), rejectedMail() (+2 more)

### Community 39 - "supabase-rest.ts"
Cohesion: 0.29
Nodes (9): GET, listAccounts(), getRewardsOverview(), authHeaders(), quoteFilterValue(), sbSelect(), sbUpdate(), SelectOptions (+1 more)

### Community 40 - "waste-data/page.tsx"
Cohesion: 0.24
Nodes (9): Category, categoryOf(), fmt(), TYPE_CARDS, WasteDataPage(), WasteRecord, MapCard(), matchCategory() (+1 more)

### Community 41 - "package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, start, test (+1 more)

### Community 42 - "AdminShell"
Cohesion: 0.43
Nodes (7): fontStyle, LoginPage(), MapPage(), WasteTypesPage(), AdminShell(), useAuth(), useLiff()

### Community 43 - "StatCards.tsx"
Cohesion: 0.33
Nodes (5): matchCategory(), StatCardProps, StatCards(), StatCardsProps, WasteRecord

### Community 44 - "MascotBin.tsx"
Cohesion: 0.33
Nodes (5): k(), LEAVES, MascotBin(), TRASH, TREES

### Community 45 - "getSummary"
Cohesion: 0.60
Nodes (3): GET, GET(), getSummary()

### Community 46 - "button.tsx"
Cohesion: 0.70
Nodes (3): Button(), buttonVariants, cn()

### Community 47 - "v0-dashboardfrominn-sdesign"
Cohesion: 0.40
Nodes (4): Built with v0, Getting Started, Learn More, v0-dashboardfrominn-sdesign

## Knowledge Gaps
- **317 isolated node(s):** `metadata`, `Status`, `Notice`, `ROWS`, `STATUS_COLOR` (+312 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fontStyle` connect `map/page.tsx` to `rewards/page.tsx`, `admin-ui.tsx`, `AdminShell.tsx`, `DashboardPanels.tsx`, `ExportCsvDialog.tsx`, `waste-data/page.tsx`, `StatCards.tsx`, `users/page.tsx`, `design-tokens.ts`, `waste-types/page.tsx`, `AnnualWasteChart.tsx`, `system-info/page.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `BangKachaoMap()` connect `map/page.tsx` to `app/page.tsx`, `design-tokens.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `isSupabaseConfigured()` connect `admin-queries.ts` to `waste/dashboard/route.ts`, `supabase-rest.ts`, `mailers.ts`, `route-helpers.ts`, `getSummary`, `http.ts`, `dashboard-queries.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `metadata`, `Status`, `Notice` to the rest of the system?**
  _317 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `waste/dashboard/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08163265306122448 - nodes in this community are weakly interconnected._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06025641025641026 - nodes in this community are weakly interconnected._
- **Should `admin-ui.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09365079365079365 - nodes in this community are weakly interconnected._