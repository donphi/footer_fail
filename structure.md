footerfail/
├─ apps/
│  ├─ web/                        # Next.js 15 + Tailwind + Framer Motion
│  │  ├─ app/
│  │  │  ├─ api/
│  │  │  │  └─ sites/
│  │  │  │     └─ route.ts       # UPDATED: Reads from Supabase
│  │  │  ├─ globals.css
│  │  │  └─ page.tsx
│  │  ├─ components/
│  │  │  ├─ NewToday.tsx
│  │  │  ├─ StillOutdated.tsx
│  │  │  ├─ Archive.tsx
│  │  │  ├─ YearBadge.tsx
│  │  │  ├─ SectorTabs.tsx
│  │  │  ├─ ShotCard.tsx
│  │  │  └─ HScroll.tsx          # NEW: Horizontal scroll component
│  │  ├─ lib/
│  │  │  ├─ brandWeight.ts
│  │  │  └─ supabase.ts          # NEW: Supabase client & types
│  │  ├─ public/
│  │  │  └─ shots/.gitkeep       # Now just placeholder, images in Supabase
│  │  ├─ data/                    # DEPRECATED: Moving to Supabase
│  │  │  └─ .gitkeep
│  │  ├─ next.config.ts
│  │  ├─ tailwind.config.ts
│  │  ├─ postcss.config.js       # NEW: PostCSS config
│  │  ├─ package.json            # UPDATED: Added Supabase deps
│  │  ├─ Dockerfile
│  │  └─ tsconfig.json
│  ├─ scraper/
│  │  ├─ src/
│  │  │  ├─ scrape.ts            # UPDATED: Writes to Supabase
│  │  │  ├─ proof.ts             # FIXED: Archive capture
│  │  │  ├─ util.ts
│  │  │  └─ types.ts
│  │  ├─ seeds/
│  │  │  ├─ targets.csv
│  │  │  └─ brands.csv           # UPDATED: Complete weights
│  │  ├─ Dockerfile
│  │  ├─ package.json            # UPDATED: Added Supabase & Sharp
│  │  ├─ playwright.config.ts
│  │  └─ tsconfig.json
│  └─ narrator/                   # NEW: AI personality system
│     ├─ src/
│     │  ├─ narrator.ts          # UPDATED: Writes to Supabase
│     │  └─ updateReadme.ts      # NEW: Auto-update README year
│     ├─ Dockerfile
│     ├─ package.json            # UPDATED: Added Supabase
│     └─ tsconfig.json
├─ supabase/                      # NEW: Database setup
│  └─ migrations/
│     └─ 001_initial_schema.sql  # Database schema
├─ .github/
│  └─ workflows/
│     └─ scrape.yml              # Daily automation
├─ docker-compose.yml            # UPDATED: All services with profiles
├─ .dockerignore
├─ .gitignore                    # NEW: Proper ignores
├─ .env.example                  # UPDATED: Supabase credentials
├─ .env                          # Your actual keys (git ignored)
├─ SETUP.md                      # NEW: Supabase setup guide
└─ README.md                     # NEW: By Chronos (year-agnostic)