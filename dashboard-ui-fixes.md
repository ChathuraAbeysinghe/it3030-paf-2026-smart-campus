# SmartCampus Dashboard — UI Bug Fix Prompt

> **අරමුණ**: Dashboard page (`/dashboard`) හි visual issues 8ක් fix කරන්න.  
> Developer ට directly hand off කරන්න.

---

## 🔴 Bug Fixes (Critical)

### Fix 1 — Navbar background color mismatch
**Problem**: Dashboard navbar `background` is dark grey/black, but homepage navbar uses `#1B2A4A` (navy).  
**Fix**:
```css
/* AuthNav / dashboard navbar */
.navbar {
  background-color: #1B2A4A; /* match homepage navy */
}
```
Both pages must share the same navbar bg color for brand consistency.

---

### Fix 2 — Active nav tab wrong color
**Problem**: "Home" active pill uses a white/grey tone — should match brand.  
**Fix**:
```css
.nav-link.active {
  background: rgba(245, 166, 35, 0.15);   /* subtle yellow tint */
  color: #F5A623;                          /* yellow text */
  border-bottom: 2px solid #F5A623;        /* underline accent */
  border-radius: 0;                        /* flat underline, not pill */
}
```

---

### Fix 3 — "N" letter showing instead of Bell icon
**Problem**: Notification button renders the letter "N" instead of a bell SVG icon.  
**Fix** (React + Lucide):
```jsx
import { Bell } from 'lucide-react'

// Replace the "N" circle with:
<button className="notif-btn" style={{ position: 'relative' }}>
  <Bell size={18} color="#ffffff" />
  <span className="badge">2</span>  {/* red dot with count */}
</button>
```
```css
.badge {
  position: absolute;
  top: -4px; right: -4px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: #EF4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #1B2A4A;
}
```

---

## 🟡 Design Issues (Medium)

### Fix 4 — Stat cards too tall / excessive padding
**Problem**: Stat cards have too much vertical padding, making them feel bloated.  
**Fix**:
```css
.stat-card {
  padding: 20px 24px;        /* was likely 32px+ */
  min-height: unset;         /* remove fixed height */
}

.stat-value {
  font-size: 36px;           /* was 48px+ */
  font-weight: 700;
  line-height: 1.1;
  margin: 8px 0 4px;
}

.stat-label {
  font-size: 11px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #6B7A99;
}
```

---

### Fix 5 — Welcome card illustration icon
**Problem**: House/campus icon is oversized (appears ~64px) inside a floating grey box, looks disconnected from the welcome text.  
**Fix**:
```jsx
/* Remove the grey box wrapper, reduce icon size */
<div className="welcome-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <div>
    <p className="label">Student Dashboard</p>
    <h2>Welcome back, {username} 👋</h2>
    <p className="sub">Same modern experience as the new homepage...</p>
  </div>
  <img src="/campus-icon.svg" alt="" style={{ width: 48, height: 48, opacity: 0.7 }} />
</div>
```

---

### Fix 6 — "What do you need today?" heading low contrast
**Problem**: Section heading is nearly invisible — ghost text on dark background.  
**Fix**:
```css
.section-heading {
  color: rgba(255, 255, 255, 0.90);    /* was rgba(255,255,255,0.15) or similar */
  font-size: 28px;
  font-weight: 700;
}

.section-subtext {
  color: rgba(255, 255, 255, 0.55);
  font-size: 15px;
}
```

---

## 🔵 Polish Issues (Minor)

### Fix 7 — "Open →" link hover state missing
**Problem**: Quick action card links have no visual hover feedback.  
**Fix**:
```css
.card-link {
  color: #6B7A99;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s ease;
}

.card-link:hover {
  color: #F5A623;   /* brand yellow on hover */
}
```

---

### Fix 8 — White cards on near-black bg (too much contrast)
**Problem**: Pure white cards (`#FFFFFF`) on very dark background (`#0f0f1a` or similar) creates jarring contrast.  

**Option A — Keep dark mode, soften cards:**
```css
.stat-card,
.quick-action-card {
  background: #1e2535;          /* dark blue-grey card */
  border: 1px solid rgba(255,255,255,0.08);
  color: #ffffff;
}

.card-title { color: #ffffff; }
.card-desc  { color: rgba(255,255,255,0.55); }
```

**Option B — Switch to light mode dashboard:**
```css
body.dashboard {
  background: #F4F6FA;
}

.stat-card,
.quick-action-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
```
> **Recommended**: Option B — light mode dashboard matches the homepage stat bar card style.

---

## ✅ Fix Checklist

| # | Issue | Type | File to edit |
|---|---|---|---|
| 1 | Navbar bg color | CSS | `AuthNav.jsx` / `navbar.css` |
| 2 | Active nav color | CSS | `NavLink.jsx` |
| 3 | Bell icon missing | Component | `NotificationButton.jsx` |
| 4 | Stat card padding | CSS | `StatCard.jsx` |
| 5 | Welcome icon size | JSX + CSS | `WelcomeBanner.jsx` |
| 6 | Section heading contrast | CSS | `dashboard.css` |
| 7 | Card link hover | CSS | `ActionCard.jsx` |
| 8 | Card/bg contrast | CSS | `dashboard.css` |

---

## 🎨 Quick Reference — Colors

```
Brand Navy:      #1B2A4A
Brand Yellow:    #F5A623
Card bg (light): #FFFFFF
Card bg (dark):  #1e2535
Page bg (light): #F4F6FA
Page bg (dark):  #0f1120
Text muted:      #6B7A99
Text on dark:    rgba(255,255,255,0.85)
Danger / badge:  #EF4444
```
