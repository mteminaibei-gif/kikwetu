# 🚀 KikwetuConnect - Quick Start Guide

## ⚡ 60-Second Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Browser
```
http://localhost:3000
```

That's it! 🎉

---

## 📝 Common Commands

### Development
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Create production build
npm run start        # Run production server
npm run lint         # Check code style
```

### Testing
```bash
npm test             # Run tests (when configured)
npm run test:watch   # Watch mode
```

---

## 🎯 What to Try First

### 1. Home Feed
Visit `http://localhost:3000/` to see:
- Question cards with upvotes
- Live debates showcase
- Trending topics
- Spaces carousel
- Create post button

### 2. Landing Page
Visit `http://localhost:3000/landing` to see:
- Public homepage
- Feature highlights
- How-it-works section
- Sign up CTA

### 3. Sign Up
Visit `http://localhost:3000/signup` to:
- Try the signup form
- Switch between Email/Phone tabs
- See form validation
- Check responsive design

### 4. Space Detail
Visit `http://localhost:3000/spaces/1` to see:
- Community header
- Tabbed content (Posts/Debates/Quiz)
- Moderators section
- Community guidelines

---

## 🎨 Exploring the Design System

### Colors
Open `app/globals.css` to see:
- Kikwetu Green (#2d7c4a)
- Kikwetu Orange (#d97e3a)
- Kikwetu Brown (#6b4423)
- Dark/light mode support

### Components
All components in `components/` folder:
```
Button.tsx     - Variants: primary, secondary, ghost, outline
Badge.tsx      - Variants: verified, live, expert, warning
Card.tsx       - Variants: default, elevated, outlined
```

### Pages
Try navigating to:
- `/landing` - Public landing
- `/about` - About company
- `/contact` - Contact form
- `/privacy` - Privacy policy
- `/terms` - Terms of service

---

## 📱 Responsive Design

### Test Mobile Responsiveness
1. Open DevTools (F12)
2. Click Device Toolbar (Ctrl+Shift+M)
3. Try different screen sizes:
   - iPhone 12 (390px)
   - iPad (768px)
   - Desktop (1280px)

### Breakpoints to Test
- `sm:` 640px (large phones)
- `md:` 768px (tablets)
- `lg:` 1024px (laptops)
- `xl:` 1280px (desktops)

---

## 🎨 Customizing the Theme

### Change Primary Color
1. Edit `app/globals.css`:
```css
--kikwetu-green: #YOUR_NEW_COLOR;
```

2. Update Tailwind config `tailwind.config.ts`:
```ts
'kikwetu-green': '#YOUR_NEW_COLOR'
```

3. Restart dev server

### Add New Component
1. Create `components/NewComponent.tsx`:
```tsx
export const NewComponent = () => {
  return <div>Hello</div>;
};
```

2. Use in pages:
```tsx
import NewComponent from '@/components/NewComponent';
```

---

## 🔍 Understanding the Structure

### Page Creation
All pages go in `app/` folder:
```
app/
├── page.tsx           # Home page (/)
├── landing/page.tsx   # Landing page (/landing)
├── signup/page.tsx    # Sign up (/signup)
└── spaces/[id]/page.tsx  # Dynamic route (/spaces/1)
```

### Component Structure
```tsx
'use client';  // Enable client-side features

import React from 'react';
import { Button } from '@/components/ui/Button';

export const MyComponent = () => {
  return (
    <div className="p-4 bg-bg-secondary rounded-lg">
      <Button>Click me</Button>
    </div>
  );
};

export default MyComponent;
```

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9    # macOS/Linux
netstat -ano | findstr :3000      # Windows
```

### Build Errors
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### TypeScript Errors
```bash
# Check types
npx tsc --noEmit
```

---

## 📚 Key Files to Explore

### Layout & Theme
- `app/layout.tsx` - Root layout with metadata
- `app/globals.css` - Global styles and colors
- `tailwind.config.ts` - Tailwind configuration

### Components
- `components/Header.tsx` - Navigation header
- `components/Sidebar.tsx` - Navigation sidebar
- `components/Feed.tsx` - Main feed

### Pages
- `app/page.tsx` - Home page
- `app/landing/page.tsx` - Landing page
- `app/signup/page.tsx` - Registration

---

## 🌐 Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=KikwetuConnect
```

Use in code:
```tsx
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

---

## 📦 Adding Dependencies

### Install Package
```bash
npm install package-name
```

### Dev Dependency
```bash
npm install --save-dev package-name
```

### Popular Additions
```bash
# Forms
npm install react-hook-form zod

# HTTP
npm install axios

# Storage
npm install zustand

# Testing
npm install --save-dev vitest @testing-library/react
```

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Build for Production
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t kikwetu-connect .
docker run -p 3000:3000 kikwetu-connect
```

---

## 📊 Performance Tips

### Check Build Size
```bash
npm run build
# Check .next/static directory
```

### Analyze Bundle
```bash
npm install --save-dev @next/bundle-analyzer
# Add to next.config.ts and run build
```

### Lighthouse Audit
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Click "Analyze page load"

---

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Lucide Icons](https://lucide.dev)

---

## 📞 Getting Help

### Check Documentation
- `README.md` - Overview
- `DEVELOPMENT_GUIDE.md` - Development tips
- `BUILD_SUMMARY.md` - Build info
- `SEO_STRATEGY.md` - SEO guidelines

### Debug Code
1. Use browser DevTools (F12)
2. Check React DevTools extension
3. Look at console for errors
4. Use `console.log()` for debugging

---

## ✅ Your First Task

Try this:
1. Open `components/QuestionCard.tsx`
2. Find the `upvotes.toLocaleString()` line
3. Change styling of the upvote count
4. See changes in browser (hot reload)
5. Great! You've made your first edit 🎉

---

## 🎯 Next Steps

After setup:
1. Explore the codebase
2. Read the documentation
3. Try adding a new component
4. Create a new page
5. Deploy to Vercel
6. Start backend integration

---

## 💡 Pro Tips

- Use Ctrl+` to open terminal in VS Code
- Use Cmd+Shift+P (or Ctrl+Shift+P) for command palette
- Install "Tailwind CSS IntelliSense" extension for autocomplete
- Use `npm run dev` for fastest development

---

**Happy coding! 🚀**

Need help? Check the docs or reach out to the team.
