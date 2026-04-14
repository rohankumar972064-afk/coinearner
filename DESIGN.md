# CoinEarner Design Brief

**Category:** Productivity / Rewards Platform | **Tone:** Energetic, Motivational, Trustworthy | **Differentiation:** Vibrant gamified earning interface with coin-centric iconography; clear CTAs drive earning actions.

**Visual Direction:** Bold, mobile-first rewards platform designed for Indian audiences. Golden/amber primary paired with electric blue accents create energetic motivation. Dark navy admin mode enables focused user management. Geometric shapes, high contrast, and clear hierarchy drive engagement toward earning activities.

## Color Palette

| Token                | Light Mode        | Dark Mode         | Usage                           |
| -------------------- | ----------------- | ----------------- | ------------------------------- |
| **Primary** (Golden)  | oklch(0.62 0.19 45)  | oklch(0.72 0.20 45)  | CTAs, coin rewards, active states    |
| **Secondary** (Blue)  | oklch(0.55 0.20 200) | oklch(0.65 0.22 200) | Highlights, notifications, accents   |
| **Accent** (Emerald)  | oklch(0.50 0.24 155) | oklch(0.60 0.28 155) | Success, verification, completion    |
| **Destructive** (Red) | oklch(0.58 0.25 20)  | oklch(0.68 0.27 20)  | Block actions, denials, errors       |
| **Background**        | oklch(0.98 0 0)      | oklch(0.10 0 210)    | Main surface                        |
| **Foreground**        | oklch(0.12 0 210)    | oklch(0.96 0 0)      | Text, primary content               |
| **Muted**             | oklch(0.94 0.02 210) | oklch(0.25 0.02 210) | Secondary text, disabled states    |
| **Card**              | oklch(1.0 0 0)       | oklch(0.15 0 210)    | Elevated surfaces                   |
| **Border**            | oklch(0.92 0.01 210) | oklch(0.22 0.01 210) | Dividers, input strokes            |

## Typography

| Role       | Font               | Usage                                           |
| ---------- | ------------------ | ----------------------------------------------- |
| **Display**  | BricolageGrotesque | Headlines, balance amount, CTAs (font-display)  |
| **Body**     | DMSans             | Body text, labels, earning details (font-body)  |
| **Mono**     | GeistMono          | Amounts, codes, referral IDs (font-mono)        |

Type Scale: 12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px, 48px.

## Structural Zones

| Zone           | Background      | Border/Division | Treatment                              |
| -------------- | --------------- | --------------- | -------------------------------------- |
| **Header**     | bg-card         | border-b        | User profile + balance display, elevated |
| **Main Content** | bg-background   | —               | Alternating earning cards              |
| **Earning Cards** | bg-card         | border          | Rounded, shadowed, hover lift effect    |
| **CTA Zone**   | bg-primary      | —               | Prominent golden buttons with depth    |
| **Admin Sidebar** | bg-sidebar      | border-r        | Dark navy, persistent left navigation  |
| **Admin Stats** | bg-card         | border          | Grid layout, data-focused              |
| **Footer**     | bg-muted/30     | border-t        | Transaction history, lightweight       |

## Component Patterns

- **Buttons:** `.btn-coin` (primary golden, scale 105% on hover), `.btn-coin-secondary` (electric blue); both use `font-display` font-bold for emphasis
- **Cards:** `.card-elevated` with shadow escalation on hover; 12px border-radius (--radius)
- **Badges:** `.badge-success` for earnings, status displays; emerald accent background
- **Streaks:** `.streak-badge` circular gradient (golden to blue) for day counts
- **Balance Display:** `.text-balance` displays coin amount in display font, 3xl size, primary color

## Motion & Animation

| Animation       | Duration | Easing                    | Applied To                            |
| --------------- | -------- | ------------------------- | ------------------------------------- |
| bounce-subtle   | 2s       | infinite                  | Coin icons, earning notifications     |
| pulse-coin      | 2s       | cubic-bezier(0.4,0,0.6,1) | Balance updates, new earnings         |
| shimmer         | 2s       | infinite                  | Ad loading states, reward reveals     |
| transition-smooth | 0.3s   | cubic-bezier(0.4,0,0.2,1) | All interactive elements (buttons, cards, hovers) |

## Responsive & Accessibility

- **Mobile-first:** sm: 640px, md: 768px, lg: 1024px breakpoints
- **Dark mode:** Enabled via `.dark` class; dual-theme tokens ensure AA+ contrast in both modes
- **Accessibility:** Semantic HTML, sufficient color contrast (L diff ≥ 0.7), focus rings use primary color, coin tooltips for icons

## Admin Panel

- **Sidebar:** Dark navy background, persistent at md+ breakpoints
- **Content grid:** Stats cards (users, earnings, withdrawals) in 2x2 or 3-column layout
- **Actions:** User blocking, coin grants, withdrawal approvals use secondary (blue) buttons
- **Data visualization:** Chart colors use chart-1 through chart-5 tokens (primary, secondary, accent, warm, light)

## Constraints & Signature Detail

**Anti-patterns avoided:** No default Tailwind blue; no uniform rounded corners; no flat neutral palette; no scattered animations.

**Signature detail:** Animated coin icon (`bounce-subtle`) on balance displays and earning confirmations creates tactile, rewarding feedback. Gradient streaks (primary→secondary) on streak badges encode gamification visually.

---

*Design system tokens: OKLCH color space, 12px base radius, dual typography pairing (display + body), motion choreography for earning moments. Last updated: Apr 2026.*
