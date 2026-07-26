# 🛡️ KikwetuConnect - Our Knowledge, Our Stories, Our Future

Kenya's premier education and community-focused social platform blending Quora's knowledge-sharing depth with vibrant elements from Twitter, Reddit, LinkedIn, TikTok, and WhatsApp groups—tailored for Kenyans and the diaspora.

## 🌟 What is KikwetuConnect?

**KikwetuConnect** is an education-first, culture-proud social platform where:
- Students ask questions and learn from verified experts
- Professionals build careers and networks
- Farmers share agricultural innovations
- Communities engage in meaningful debates (Mjadala)
- Creators share stories and tutorials
- Everyone's voice matters, in their own language

**Tagline**: "Maarifa Yetu, Hadithi Zetu, Mustakabali Wetu" (Our Knowledge, Our Stories, Our Future)

## ✨ Key Features

### 🌍 Multi-Language Support
- English, Kiswahili, Luo, Kikuyu, Luhya, and more
- Auto-translate posts with user approval
- Voice-to-text and text-to-speech for local languages

### 🎓 Educational Content
- Q&A (Questions & Answers) - Quora-style discussions
- Quizzes with leaderboards (topic & county-based)
- Live Debates (Mjadala) - Audio rooms for real-time discussions
- Spaces (Communities) - Topic-specific groups

### 🏆 Gamification & Recognition
- Points and Karma system
- Verified Expert badges
- County & topic leaderboards
- Creator rewards & monetization

### 📱 Mobile-First & Offline
- Progressive Web App (PWA)
- Offline-capable with data-saving modes
- Voice input for accessibility
- Touch-friendly design

### 🛡️ Safe & Moderated
- AI + human moderation
- Rooted in Utu (humanity) values
- Fact-checking partnerships
- Anti-harassment tools

### 🌐 Professional Networking
- LinkedIn-style profiles
- Skills & endorsements
- Job board for Kenyan opportunities
- Career growth resources

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 16 with React 19
- **Styling**: Tailwind CSS v4 with custom Kikwetu color palette
- **Language**: TypeScript
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

### Project Structure
```
kikwetu-connect/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home feed page
│   ├── globals.css        # Global styles with Kikwetu theme
│   ├── landing/           # Public landing page
│   ├── signup/            # User registration
│   ├── login/             # User authentication
│   ├── about/             # About page
│   ├── contact/           # Contact page
│   ├── terms/             # Terms of Service
│   ├── privacy/           # Privacy Policy
│   ├── onboarding/        # Welcome screen
│   └── spaces/[id]/       # Community detail pages
├── components/            # Reusable UI components
│   ├── Header.tsx         # Navigation header
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── Layout.tsx         # Main layout wrapper
│   ├── Feed.tsx           # Posts feed
│   ├── QuestionCard.tsx   # Question component
│   ├── DebateCard.tsx     # Debate component
│   ├── SpacesCarousel.tsx # Communities carousel
│   ├── CreatePostModal.tsx # Post creation modal
│   ├── TrendingSidebar.tsx # Trending & suggestions
│   ├── OnboardingScreen.tsx # Welcome screen
│   └── ui/                # UI primitives
│       ├── Button.tsx     # Button component
│       ├── Badge.tsx      # Badge component
│       └── Card.tsx       # Card component
├── public/                # Static assets
├── tailwind.config.ts     # Tailwind configuration
└── package.json           # Dependencies
```

## 🎨 Design System

### Color Palette
```css
/* Kikwetu Green - Primary */
--kikwetu-green: #2d7c4a
--kikwetu-green-light: #4a9d63

/* Kikwetu Orange - Accent */
--kikwetu-orange: #d97e3a
--kikwetu-orange-light: #e89a52

/* Kikwetu Brown - Secondary */
--kikwetu-brown: #6b4423
--kikwetu-brown-light: #8b5e3f
```

### Typography
- Font Family: System UI (Google Geist Sans/Mono)
- Headings: Bold, 28px-48px depending on level
- Body: Regular, 14px-16px
- Captions: 12px, secondary color

### Spacing
- Base unit: 4px
- Mobile padding: 12-16px
- Desktop padding: 24-32px
- Component gaps: 8px-24px

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/kikwetuconnect/web.git
cd kikwetu-connect

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

### Build for Production
```bash
npm run build
npm start
```

### Lint Code
```bash
npm run lint
```

## 📄 Pages & Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home | Main feed with questions, debates, spaces |
| `/landing` | Landing | Public homepage with features & signup CTA |
| `/signup` | Sign Up | User registration (email/phone) |
| `/login` | Login | User authentication |
| `/about` | About | Company mission, values, team |
| `/contact` | Contact | Contact form & support info |
| `/terms` | Terms | Terms of Service |
| `/privacy` | Privacy | Privacy Policy |
| `/onboarding` | Onboarding | Welcome splash screen |
| `/spaces/[id]` | Space Detail | Community page with tabbed content (Posts/Debates/Quiz) |

## 🎯 Responsive Design

- **Mobile**: 320px - 640px (full-width, optimized for thumb)
- **Tablet**: 641px - 1024px (multi-column)
- **Desktop**: 1025px+ (full-featured layout)

All components use Tailwind's responsive prefixes:
- `sm:` for small screens
- `md:` for medium screens
- `lg:` for large screens
- `xl:` for extra-large screens

## 🔐 SEO & Metadata

- ✅ Global metadata with Open Graph tags
- ✅ Twitter card support
- ✅ Structured keywords targeting Kenya, education, community
- ✅ Mobile viewport optimization
- ✅ Dark/light theme detection
- ✅ Canonical URLs
- ✅ robots.txt & sitemap ready

## ♿ Accessibility

- ✅ Semantic HTML structure
- ✅ ARIA labels on icon buttons
- ✅ Color contrast WCAG AA compliant
- ✅ Keyboard navigation support
- ✅ Focus indicators on interactive elements
- ✅ Screen reader friendly
- ✅ Touch-friendly button sizes (min 44px)

## 🌐 Internationalization

Prepared for multi-language support:
- English (en)
- Kiswahili (sw)
- Luo (luo)
- Kikuyu (ki)
- Luhya (luh)

## 📦 Dependencies

### Core
- `next`: 16.2.11 - React framework
- `react`: 19.2.4 - UI library
- `react-dom`: 19.2.4 - DOM rendering
- `tailwindcss`: 4.0.0 - Styling
- `lucide-react`: Icons library

### Dev
- `typescript`: 5.x - Type safety
- `eslint`: 9.x - Code linting
- `@tailwindcss/postcss`: 4.x - Tailwind processing

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./next
COPY --from=builder /app/public ./public
COPY package*.json ./
RUN npm ci --only=production
CMD ["npm", "start"]
```

## 📊 Performance

- ✅ Optimized bundle size with Next.js
- ✅ Image optimization ready
- ✅ Code splitting by route
- ✅ Lazy loading for modal components
- ✅ CSS purging with Tailwind

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

KikwetuConnect is open source under the MIT License.

## 💬 Support & Community

- **Email**: hello@kikwetuconnect.com
- **Twitter**: [@KikwetuConnect](https://twitter.com/kikwetuconnect)
- **GitHub Issues**: [Report bugs here](https://github.com/kikwetuconnect/web/issues)

## 🎓 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React Documentation](https://react.dev)
- [Lucide Icons](https://lucide.dev)

---

**Made with ❤️ for Kenya's Knowledge Future**

*"Maarifa Yetu, Hadithi Zetu, Mustakabali Wetu"* - Our Knowledge, Our Stories, Our Future
