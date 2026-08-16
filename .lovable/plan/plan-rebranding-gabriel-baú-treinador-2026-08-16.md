---
name: Rebranding Gabriel Baú
description: Plan to rebrand the entire application from "Método Renascer" to "Gabriel Baú Treinador", disable landing pages, and clean up the visual identity to match a minimalist premium style.
type: feature
---

# Plan: Rebranding Gabriel Baú Treinador

The goal is to transform the "Método Renascer" platform into a personalized support system for "Gabriel Baú Treinador", prioritizing existing student access and cleaning up the visual identity to a minimalist, premium style (removing oranges, using clean colors).

## 1. Visual Identity & Brand Cleanup

- **Typography**: Keep the premium fonts (Fraunces, Inter Tight, Montserrat) but ensure consistency.
- **Colors**: Replace the primary orange (`#FF5A1F`, `#FF6500`) with a clean, minimalist palette (Black, White, Slate/Gray tones) as requested.
- **Naming**: Replace all occurrences of "Método Renascer" or "Renascer" with "Gabriel Baú Treinador" across the codebase (UI, PDFs, Page Titles, Metadata).
- **Logo**: Prepare for the new logo (the user will provide it). For now, use a clean text-based placeholder "Gabriel Baú".

## 2. Navigation & Access Control

- **Landing Page**: Disable the current sales landing pages (`/`, `/landing-app`, `/quiz`).
- **Home Route**: Change the root route (`/`) to redirect directly to the login page (`/auth`) or show a very minimalist login entry point.
- **Header/Footer**: Remove sales CTAs. The only action should be "Login/Entrar".

## 3. Technical Implementation Tasks

### 3.1 Global Styles (`src/index.css`)
- Update CSS variables to remove orange accents.
- Set `--primary` and `--accent` to a neutral premium color (e.g., white or a specific slate).
- Clean up legacy classes that hardcode brand colors.

### 3.2 Metadata & Config
- Update `index.html` title and meta tags.
- Update `capacitor.config.ts` and mobile-related strings (`strings.xml`, `Info.plist`).
- Update `sw.js` (Service Worker) metadata.

### 3.3 Auth Page Redesign (`src/pages/Auth.tsx`)
- Simplify the login screen.
- Remove references to "Método Renascer".
- Remove "Conheça nossos planos" links.

### 3.4 Component & Page Audit
- Search and replace "Renascer" with "Gabriel Baú Treinador" in all `.tsx` files.
- Special attention to:
    - `src/components/layout/ClientSidebar.tsx` (Logo/Header)
    - `src/pages/Renascer.tsx` (Main student page)
    - PDF Generation logic (SIS reports, etc.)
    - Edge Functions (if they return brand names).

### 3.5 Routes (`src/App.tsx`)
- Redirect `/` to `/auth`.
- Remove or hide landing/quiz routes.

## 4. Design Guidelines (Senior Level)

- **Minimalism**: Focus on whitespace and high-quality typography.
- **Tone**: Professional, exclusive, personal trainer/consultancy focus.
- **Mobile First**: Ensure the transition to the new brand looks perfect on the mobile app.

---
**Next Step**: Implement the color and naming transition after user approval.
