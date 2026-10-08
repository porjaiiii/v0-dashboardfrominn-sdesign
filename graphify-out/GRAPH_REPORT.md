# Graph Report - v0-dashboardfrominn-sdesign  (2026-10-08)

## Corpus Check
- 126 files · ~209,095 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 929 nodes · 2093 edges · 62 communities (54 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6055fae8`
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
- supabase-auth.ts
- route-helpers.ts
- users/page.tsx
- design-tokens.ts
- Dashboard login (users + admins) — design
- accounts.ts
- admin-queries.ts
- fontStyle
- waste-types/page.tsx
- File Structure
- devDependencies
- contact/page.tsx
- components.json
- signup/route.ts
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
- reset-password/route.ts
- waste-data/page.tsx
- admin-session.ts
- lib.mjs
- MapCard.tsx
- scripts
- AdminShell.tsx
- StatCards.tsx
- MascotBin.tsx
- getSummary
- button.tsx
- v0-dashboardfrominn-sdesign
- postcss.config.mjs
- map/page.tsx
- @line/liff
- next.config.mjs
- next-env.d.ts
- next
- TopContributors.tsx
- tailwind-merge
- tw-animate-css
- SelectPill.tsx
- package.json
- nodemailer

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
- `WasteDataPage()` --calls--> `downloadCsv()`  [EXTRACTED]
  app/admin/waste-data/page.tsx → components/dashboard/admin-ui.tsx

## Import Cycles
- None detected.

## Communities (62 total, 8 thin omitted)

### Community 0 - "waste/dashboard/route.ts"
Cohesion: 0.11
Nodes (28): SUBMISSION_HEADERS, buildNameMap(), buildNameMap(), findCol(), findCol(), GET(), GET(), REG_HEADERS (+20 more)

### Community 1 - "types.ts"
Cohesion: 0.06
Nodes (30): MOCK_ADMIN_KEYS, MOCK_COUPONS, MOCK_REWARDS, MOCK_STAFF_USERS, MOCK_USERS, MOCK_WASTE_RECORDS, MOCK_WASTE_SUBTYPES, MOCK_WASTE_TYPES (+22 more)

### Community 2 - "admin-ui.tsx"
Cohesion: 0.09
Nodes (30): Notice, TODO: เปลี่ยนเป็นข้อมูลจริงจาก API/Google Sheets, ROWS, Status, STATUS_COLOR, td, th, PointFormulaPage() (+22 more)

### Community 3 - "map-data.ts"
Cohesion: 0.16
Nodes (11): DonationCard(), DonationCardProps, fontStyle, TYPE_COLORS, TYPE_ICONS, Donation, DONATIONS, monthlyBase (+3 more)

### Community 4 - "waste-records/page.tsx"
Cohesion: 0.15
Nodes (21): StaffPage(), AdminUsersPage(), COLUMNS, Row, SORT_KEYS, Status, STATUS_COLOR, STATUS_LABEL (+13 more)

### Community 5 - "DashboardPanels.tsx"
Cohesion: 0.12
Nodes (16): axisTick, ChartPanel(), Co2ChartPanel(), MonthlySummary(), num(), RewardsPanel(), TH_SHORT, Tone (+8 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 7 - "policy.ts"
Cohesion: 0.10
Nodes (26): Ctx, DELETE, PATCH, ActionPlan, ActionSubject, Allowed, AUTH_PAGES, BAD_ROLE (+18 more)

### Community 8 - "login.test.ts"
Cohesion: 0.17
Nodes (18): fetchMock, setSessionCookie(), withCookie(), signToken(), accountRow(), ADMIN_ID, ORIGIN, request() (+10 more)

### Community 9 - "mailers.ts"
Cohesion: 0.20
Nodes (22): claimEmailSlot(), getRootAccount(), appBaseUrl(), link(), notifyRootOfSignup(), sendDecisionEmail(), sendPasswordResetEmail(), sendVerificationEmail() (+14 more)

### Community 10 - "supabase-auth.ts"
Cohesion: 0.24
Nodes (12): AuthApiError, authFetch(), createAuthUser(), deleteAuthUser(), ensureOk(), errorCode(), fetchMock, updateAuthUserPassword() (+4 more)

### Community 11 - "route-helpers.ts"
Cohesion: 0.15
Nodes (16): GET, GET, PATCH, GET, PATCH, GET, GET, GET (+8 more)

### Community 12 - "users/page.tsx"
Cohesion: 0.12
Nodes (23): COLUMNS, dash(), KEYS, SORT_KEYS, Staff, toStaff(), dash(), formatThaiDate() (+15 more)

### Community 13 - "design-tokens.ts"
Cohesion: 0.16
Nodes (18): ChartRow, FULL_MONTH_NAMES, matchCategory(), MONTH_NAMES, MonthlyWasteChart(), MonthlyWasteChartProps, WasteRecord, matchCategory() (+10 more)

### Community 14 - "Dashboard login (users + admins) — design"
Cohesion: 0.10
Nodes (20): Account lifecycle, API routes, Configuration, Constraints (from the user), Dashboard login (users + admins) — design, `dashboard.transfer_root(p_new_root uuid)`, Database: `supabase/dashboard_schema.sql`, Decisions (+12 more)

### Community 15 - "accounts.ts"
Cohesion: 0.19
Nodes (15): AccountListItem, AccountRow, DASHBOARD_SCHEMA, findOne(), getAccountById(), isUuid(), ACCOUNT_STATUSES, AccountStatus (+7 more)

### Community 16 - "admin-queries.ts"
Cohesion: 0.20
Nodes (25): GET, listAccounts(), activeAdmins(), activeCouponCount(), dateRange(), getFormulas(), getRewardStock(), getStaff() (+17 more)

### Community 17 - "fontStyle"
Cohesion: 0.15
Nodes (15): AdminSidebar(), GridIcon(), ITEM_HREFS, MENU, MenuGroup, rowBase, MenuButton(), rowBase (+7 more)

### Community 18 - "waste-types/page.tsx"
Cohesion: 0.14
Nodes (16): formatKg(), InsightCard(), InsightCardProps, MONTH_NAMES, TAMBON_LIST_DATA, WasteRecord, YEAR_OPTIONS, BASE_KG (+8 more)

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

### Community 23 - "signup/route.ts"
Cohesion: 0.48
Nodes (11): POST, POST, POST, POST, getAccountByEmail(), field(), ok(), readBody() (+3 more)

### Community 24 - "dependencies"
Cohesion: 0.11
Nodes (19): @base-ui/react, class-variance-authority, clsx, lucide-react, dependencies, @base-ui/react, class-variance-authority, clsx (+11 more)

### Community 25 - "LandingStats.tsx"
Cohesion: 0.15
Nodes (13): CLOUDS, EXPLAIN, fmt(), hillHalfWidth(), LandingStats(), layoutTrees(), Placed, PublicStats (+5 more)

### Community 26 - "http.ts"
Cohesion: 0.26
Nodes (14): POST(), GET(), authConfigured(), adminActionRoute(), FOREIGN_ORIGIN_MESSAGE, isSameOrigin(), jsonError(), Need (+6 more)

### Community 27 - "auth-context.tsx"
Cohesion: 0.14
Nodes (11): ibmPlexSansThai, metadata, AuthContext, AuthContextType, AuthProvider(), EmailUser, MOCK_USERS, LiffContext (+3 more)

### Community 28 - "app/page.tsx"
Cohesion: 0.14
Nodes (12): TAMBON, WASTE_TYPES, HeroCarousel(), Hotspot, Slide, SLIDES, BOTTLE, CAN (+4 more)

### Community 29 - "AnnualWasteChart.tsx"
Cohesion: 0.24
Nodes (7): AnnualWasteChart(), getYearBE(), matchCategory(), TYPE_SERIES, WasteRecord, axisCaptionStyle, axisTickStyle

### Community 30 - "system-info/page.tsx"
Cohesion: 0.12
Nodes (11): AdminLoginPage(), safeNext(), BUGS, FILES, HINT, INPUT, LABEL, TODO: บันทึกลงฐานข้อมูลจริง (+3 more)

### Community 31 - "dashboard-queries.ts"
Cohesion: 0.25
Nodes (13): GET, aggregate(), buildMock(), getDashboard(), key(), loadFromSupabase(), pct(), TODO: ถ้าข้อมูลมาก ให้สร้าง SQL view/RPC… (+5 more)

### Community 32 - "waste-management/page.tsx"
Cohesion: 0.15
Nodes (8): metadata, metadata, OUTCOMES, STEPS, AboutSection(), SiteFooter(), VideoSection(), SiteNav()

### Community 33 - "rewards/page.tsx"
Cohesion: 0.16
Nodes (11): DONUT_COLORS, n(), outlineSmall, periodOptions(), RewardsPage(), TH_MONTHS, TONE, SectionTitle() (+3 more)

### Community 34 - "sorting/page.tsx"
Cohesion: 0.16
Nodes (11): LandingPage(), CATEGORIES, Category, CategoryCard(), iconProps, Item, metadata, STEPS (+3 more)

### Community 35 - "sections.tsx"
Cohesion: 0.21
Nodes (8): ABOUT_STEPS, LINE_STEPS, DEEP, FOREST, Leaf(), LIME, MID, RecycleBadge()

### Community 36 - "reset-password/route.ts"
Cohesion: 0.22
Nodes (14): POST, POST, updateAccounts(), MIN_SECRET_LENGTH, sessionSecret(), LINK_INVALID_MESSAGE, passwordError(), WEAK_PASSWORD_MESSAGE (+6 more)

### Community 37 - "waste-data/page.tsx"
Cohesion: 0.13
Nodes (18): Category, categoryOf(), fmt(), TYPE_CARDS, WasteDataPage(), WasteRecord, CsvButton(), SummaryCard() (+10 more)

### Community 38 - "admin-session.ts"
Cohesion: 0.29
Nodes (11): POST(), GET(), authMode, checkPassword(), createSessionToken(), safeEqual(), SESSION_COOKIE, SESSION_MAX_AGE_SECONDS (+3 more)

### Community 39 - "lib.mjs"
Cohesion: 0.20
Nodes (13): email, fullName, password, rl, accounts, call(), createAuthUser(), emailArg() (+5 more)

### Community 40 - "MapCard.tsx"
Cohesion: 0.29
Nodes (6): BangKachaoMap(), BangKachaoMapProps, SUBDISTRICT_HIGHLIGHTS, TAMBON_KEYS, MapCard(), MapCardProps

### Community 41 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, create-root-admin, dev, lint, start, test, transfer-root

### Community 42 - "AdminShell.tsx"
Cohesion: 0.42
Nodes (7): fontStyle, LoginPage(), MapPage(), WasteTypesPage(), AdminShell(), useAuth(), useLiff()

### Community 43 - "StatCards.tsx"
Cohesion: 0.29
Nodes (6): matchCategory(), StatCardProps, StatCards(), StatCardsProps, WasteRecord, COLORS

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

### Community 49 - "map/page.tsx"
Cohesion: 0.20
Nodes (9): fontStyle, GREY_SEGMENTS, MapWithPins(), MapWithPinsProps, PIN_COLORS, PIN_LABELS, DROP_OFF_POINTS, DropOffPoint (+1 more)

### Community 54 - "TopContributors.tsx"
Cohesion: 0.22
Nodes (7): BADGE_STYLES, fontStyle, maskName(), TopContributors(), TopContributorsProps, Contributor, TOP_CONTRIBUTORS

### Community 59 - "SelectPill.tsx"
Cohesion: 0.40
Nodes (5): normalise(), SelectOption, SelectPill(), SelectPillProps, PILL_HEIGHT

### Community 60 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

## Knowledge Gaps
- **327 isolated node(s):** `metadata`, `Status`, `Notice`, `ROWS`, `STATUS_COLOR` (+322 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fontStyle` connect `fontStyle` to `rewards/page.tsx`, `admin-ui.tsx`, `DashboardPanels.tsx`, `waste-data/page.tsx`, `AdminShell.tsx`, `StatCards.tsx`, `users/page.tsx`, `design-tokens.ts`, `waste-types/page.tsx`, `SelectPill.tsx`, `AnnualWasteChart.tsx`, `system-info/page.tsx`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `BangKachaoMap()` connect `MapCard.tsx` to `map/page.tsx`, `app/page.tsx`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `isSupabaseConfigured()` connect `admin-queries.ts` to `reset-password/route.ts`, `admin-session.ts`, `mailers.ts`, `route-helpers.ts`, `getSummary`, `http.ts`, `dashboard-queries.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `metadata`, `Status`, `Notice` to the rest of the system?**
  _327 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `waste/dashboard/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10795454545454546 - nodes in this community are weakly interconnected._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06401137980085349 - nodes in this community are weakly interconnected._
- **Should `admin-ui.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09009009009009009 - nodes in this community are weakly interconnected._