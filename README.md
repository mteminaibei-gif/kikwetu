# KikwetuConnect

East Africa's knowledge platform connecting all 47 Kenyan counties. Learn, share, and grow with verified professionals in farming, tech, education, culture, and health.

## 🌍 Overview

**KikwetuConnect** (Swahili: "Our Place Connect") is a mobile-first social-education platform built for Kenya. It combines community discussions (Baraza), expert learning (Students Area), local marketplaces (Mtaa Exchange), neighborhood safety (Nyumba Kumi), and live audio rooms — all in English and Kiswahili.

## ✨ Features

### Core Platform
- **Baraza (Feed)** - County-tagged discussions with up/down votes, emoji reactions, save/bookmark, and multi-platform sharing
- **Spaces** - Themed communities: #KilimoSmart, Nairobi Tech, Swahili Folklore, Mombasa Trade, Nyumba Kumi
- **Heshima (Karma)** - Earn points for quality contributions, unlock badges and expert status
- **Bilingual** - Full English/Kiswahili toggle with persistent language preference

### Learning & Professionals
- **Students Area** - Browse verified professionals by expertise, book 1-on-1 chat sessions
- **Professional Verification** - Admin-gated approval workflow with qualification upload
- **Rating & Tipping** - Post-session ratings + M-Pesa tips (70/30 split)

### Community Features
- **Nyumba Kumi** - Neighborhood safety watch with urgent alerts, categories, and WhatsApp sharing
- **Live Radio** - Curated Kenyan stations via Radio Browser API
- **Mtaa Exchange** - Local marketplace for produce, services, and crafts

### Technical
- **Offline-First** - IndexedDB queue with background sync on reconnect
- **Real-time** - Supabase Realtime for votes, replies, notifications
- **PWA Ready** - Installable, responsive, safe-area aware
- **SEO Optimized** - JSON-LD structured data, hreflang, OG/Twitter cards

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your Supabase URL and anon key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard (gated)
│   ├── chat/[id]/         # Teaching session chat
│   ├── feed/              # Main Baraza feed
│   ├── nyumba-kumi/       # Neighborhood safety
│   ├── professionals/     # Expert directory & requests
│   ├── students/          # Student learning hub
│   └── thread/[id]/       # Thread detail with replies
├── components/
│   ├── FeedView.tsx       # Feed with voting, emojis, sharing
│   ├── Landing.tsx        # Hero with Savannah doodle animation
│   ├── Navbar.tsx         # Sticky, scroll-aware, bilingual
│   └── ...                # 30+ reusable components
├── context/
│   ├── AppContext.tsx     # Global state (threads, votes, notifications)
│   └── AuthContext.tsx    # Supabase auth + profile sync
├── lib/
│   ├── supabase.ts        # Client factory
│   ├── offline.ts         # IndexedDB queue & sync
│   └── utils.ts           # Helpers (timeAgo, formatNumber, etc.)
└── types/index.ts         # TypeScript definitions
```

## 🔧 Recent Updates (v2.1.0)

### Bug Fixes
- **Vote Registration**: Fixed optimistic voting — now refreshes from DB after `toggle_vote` RPC, handles toggle correctly
- **Interaction Notifications**: Added real-time notifications for votes, emoji reactions, and replies
- **Mobile Share Dropdown**: Converted from hover-only to click-toggle for touch devices
- **Mobile Emoji Bar**: Added `flex-wrap` to prevent overflow on small screens

### UX & Visual Polish
- **Landing Page**: African Savannah animated backdrop (acacia trees, swaying grass, flying birds, dust particles, distant mountains)
- **Navbar**: Scroll-aware elevation with smooth backdrop-blur transition
- **Feed Cards**: Hover lift, gradient overlay, micro-interactions on votes/emojis
- **Hero CTA**: Staggered entrance animations, pulse indicators

### Code Quality
- Eliminated all `Math.random()` in render (deterministic `pseudoRandom` seed)
- Fixed React hooks violations in `AdminDashboard`, `ChatInterface`, `TutorialGate`
- Removed `useRef` access during render
- Cleaned unused imports across 15+ files
- Build passes with zero TypeScript/ESLint errors

## 🗄️ Supabase Schema Highlights

```sql
-- Core tables
threads (id, author_id, space_id, type, title, content, language, tags, county, upvotes_count, reply_count)
replies (id, thread_id, author_id, content)
votes (id, user_id, entity_id, entity_type, vote_type) -- unique(user_id, entity_id)
notifications (id, user_id, actor_id, type, entity_type, entity_id, is_read)
profiles (id, full_name, username, avatar_url, county, role, heshima_score, tutorial_completed)

-- Learning
professional_requests (id, profile_id, title, bio, qualifications, expertise, teaching_level, status)
teaching_sessions (id, student_id, professional_id, topic, status)
chat_messages (id, session_id, sender_id, content)
service_ratings (id, session_id, student_id, professional_id, score, review)
tips (id, session_id, student_id, professional_id, amount, status, mpesa_ref)

-- Community
nyumba_kumi_posts (id, author_id, content, category, county, urgent)
spaces (id, name, description, icon, color)
```

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-deep` | `#006B3F` | Primary actions, headers |
| `--brand-terracotta` | `#E86 | `#CC5B47` | Accent, CTAs, Kenya soil tone |
| `--brand-red` | `#D9442A` | Highlights, badges |
| `--brand-amber` | `#F5A623` | Warnings, karma |
| `--brand-warm` | `#FFF3E0` | Backgrounds |
| `--brand-bgLight` | `#FAFAFA` | Light surface |
| `--brand-bgDark` | `#1A1A1A` | Dark surface |

Typography: **Instrument Sans** (UI) + **Poppins** (Logo/Headlines)

## 📱 Mobile Optimizations

- Safe-area insets for notched devices
- Viewport `maximum-scale=5` for accessibility zoom
- Bottom nav with haptic feedback areas
- Touch-target minimum 44×44px
- Swipe gestures for thread actions (planned)

## 🔐 Admin Dashboard

Gated at `/admin` — requires `role: 'admin'` in profiles. Features:
- User/thread/reply moderation
- Professional verification queue
- Report resolution (dismiss/remove)
- Payout management for tips
- Space oversight

## 🌐 Deployment

**Vercel** (auto-deploys from `main`):
1. Connect GitHub repo
2. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

**Supabase Project**: `xzfsthlurdlrnegzejeo`
**GitHub**: https://github.com/mteminaibei-gif/kikwetu.git

## 📝 Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm run start      # Run production build
npm run lint       # ESLint + TypeScript check
```

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feat/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for Kenya** — *Kikwetu ni kwetu*