# Layout Patterns Reference

Full responsive layout structures with Tailwind CSS. Each layout is production-ready with proper breakpoint handling.

---

## 1. SaaS Landing Page

```tsx
export default function SaaSLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-xl font-bold">Logo</span>
          <nav className="hidden gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="text-sm text-muted-foreground hover:text-foreground">Log in</button>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Get Started</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:py-32">
        <span className="mb-4 inline-block rounded-full border px-3 py-1 text-xs font-medium">New: AI features</span>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Build better products, faster
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Description text that explains the value proposition in one or two sentences.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button className="w-full rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground sm:w-auto">Start Free Trial</button>
          <button className="w-full rounded-lg border px-6 py-3 font-medium sm:w-auto">Watch Demo</button>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold">Features</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">Subheading text</p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Repeat feature cards */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">Icon</div>
            <h3 className="font-semibold">Feature Title</h3>
            <p className="mt-2 text-sm text-muted-foreground">Feature description text.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-bold">Pricing</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Pricing card */}
            <div className="rounded-xl border bg-card p-8 text-left">
              <h3 className="font-semibold">Pro</h3>
              <div className="mt-4"><span className="text-4xl font-bold">$29</span><span className="text-muted-foreground">/mo</span></div>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-center gap-2"><span className="text-primary">&#10003;</span> Feature one</li>
              </ul>
              <button className="mt-8 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground">Get Started</button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold">What people say</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <blockquote className="rounded-xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">"Quote text here."</p>
            <footer className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div><p className="text-sm font-medium">Name</p><p className="text-xs text-muted-foreground">Title</p></div>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-4 py-20 text-center text-primary-foreground sm:px-6">
        <h2 className="text-3xl font-bold">Ready to get started?</h2>
        <p className="mx-auto mt-4 max-w-xl opacity-90">Call to action supporting text.</p>
        <button className="mt-8 rounded-lg bg-background px-8 py-3 font-medium text-foreground">Start Free Trial</button>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div><h4 className="font-semibold">Product</h4><ul className="mt-4 space-y-2 text-sm text-muted-foreground"><li>Features</li><li>Pricing</li></ul></div>
          <div><h4 className="font-semibold">Company</h4><ul className="mt-4 space-y-2 text-sm text-muted-foreground"><li>About</li><li>Blog</li></ul></div>
        </div>
        <div className="mx-auto mt-12 max-w-6xl border-t pt-8 text-center text-sm text-muted-foreground">
          &copy; 2026 Company. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
```

---

## 2. Dashboard (Collapsible Sidebar + Header + Content)

```tsx
"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PanelLeft } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "hidden flex-col border-r bg-card transition-all duration-300 md:flex",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && <span className="font-bold">App</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="rounded-md p-1.5 hover:bg-muted">
            <PanelLeft className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {/* Nav items */}
          <a href="#" className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-sm font-medium">
            <span className="h-4 w-4 shrink-0">D</span>
            {!collapsed && <span>Dashboard</span>}
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
            <span className="h-4 w-4 shrink-0">A</span>
            {!collapsed && <span>Analytics</span>}
          </a>
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-4 lg:px-6">
          <button className="rounded-md p-1.5 hover:bg-muted md:hidden"><PanelLeft className="h-5 w-5" /></button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Stats row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="mt-1 text-2xl font-bold">$12,345</p>
            </div>
          </div>
          {/* Main grid */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_350px]">
            <div className="rounded-xl border bg-card p-6">Chart area</div>
            <div className="rounded-xl border bg-card p-6">Activity feed</div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

## 3. Portfolio (Masonry Grid with Filter)

```tsx
"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

const categories = ["All", "Web", "Mobile", "Branding"];
const projects = [
  { title: "Project A", category: "Web", tall: true },
  { title: "Project B", category: "Mobile", tall: false },
  { title: "Project C", category: "Branding", tall: true },
  { title: "Project D", category: "Web", tall: false },
  { title: "Project E", category: "Mobile", tall: true },
  { title: "Project F", category: "Branding", tall: false },
];

export default function PortfolioGrid() {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? projects : projects.filter((p) => p.category === active);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h2 className="text-3xl font-bold">Work</h2>
      {/* Filter bar */}
      <div className="mt-8 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      {/* Masonry grid via CSS columns */}
      <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {filtered.map((project, i) => (
          <div key={i} className={cn(
            "mb-4 break-inside-avoid overflow-hidden rounded-xl border bg-card",
            project.tall ? "h-80" : "h-52"
          )}>
            <div className="flex h-full flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6">
              <span className="text-xs font-medium text-white/70">{project.category}</span>
              <h3 className="mt-1 text-lg font-semibold text-white">{project.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## 4. Blog (Readable Content Width with TOC Sidebar)

```tsx
export default function BlogLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_250px]">
        {/* Article */}
        <article className="prose prose-neutral dark:prose-invert max-w-none lg:max-w-[680px]">
          <h1>Article Title</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground not-prose">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <span>Author Name</span>
            <span>&middot;</span>
            <time>Mar 21, 2026</time>
          </div>
          <p>Article body content goes here. The prose utility from @tailwindcss/typography handles all inner element spacing and typography.</p>
          <h2 id="section-1">Section 1</h2>
          <p>Paragraph content...</p>
          <h2 id="section-2">Section 2</h2>
          <p>Paragraph content...</p>
        </article>

        {/* TOC Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <h4 className="mb-4 text-sm font-semibold">On this page</h4>
            <nav className="space-y-2 text-sm">
              <a href="#section-1" className="block text-muted-foreground hover:text-foreground">Section 1</a>
              <a href="#section-2" className="block text-muted-foreground hover:text-foreground">Section 2</a>
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}
```

---

## 5. E-commerce (Product Grid + Filters + Cart Drawer)

```tsx
"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { X, SlidersHorizontal } from "lucide-react";

export default function EcommerceLayout() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <span className="text-xl font-bold">Store</span>
        <button onClick={() => setCartOpen(true)} className="relative rounded-md p-2 hover:bg-muted">
          Cart <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">3</span>
        </button>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6">
        {/* Filter sidebar (desktop) */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <h3 className="mb-4 font-semibold">Filters</h3>
          <div className="space-y-6">
            <div>
              <h4 className="mb-2 text-sm font-medium">Category</h4>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <label className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Shoes</label>
                <label className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Jackets</label>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium">Price Range</h4>
              <input type="range" className="w-full" />
            </div>
          </div>
        </aside>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setFiltersOpen(true)}
          className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>

        {/* Product grid */}
        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">128 products</p>
            <select className="rounded-md border px-3 py-1.5 text-sm">
              <option>Sort by: Newest</option>
              <option>Price: Low to High</option>
            </select>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="group overflow-hidden rounded-xl border bg-card">
                <div className="aspect-square bg-muted transition-transform group-hover:scale-105" />
                <div className="p-4">
                  <h3 className="text-sm font-medium">Product Name</h3>
                  <p className="mt-1 text-sm font-semibold">$99.00</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Cart (3)</h3>
              <button onClick={() => setCartOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-6 flex-1 space-y-4">
              {/* Cart item */}
              <div className="flex gap-4">
                <div className="h-20 w-20 rounded-lg bg-muted" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Product</p>
                  <p className="text-sm text-muted-foreground">$99.00</p>
                </div>
              </div>
            </div>
            <button className="mt-8 w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground">Checkout &mdash; $297.00</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 6. Marketing (Full-Bleed Alternating Sections)

```tsx
export default function MarketingPage() {
  return (
    <div className="min-h-screen">
      {/* Full-bleed hero */}
      <section className="relative flex min-h-[80vh] items-center justify-center bg-gradient-to-br from-primary to-primary/60 px-4 text-center text-primary-foreground">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold sm:text-6xl lg:text-7xl">Bold Statement</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg opacity-90">Supporting text for the hero section.</p>
          <button className="mt-8 rounded-full bg-background px-8 py-3 font-medium text-foreground">Get Started</button>
        </div>
      </section>

      {/* Alternating feature: image left */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div className="aspect-[4/3] rounded-2xl bg-muted" />
        <div>
          <span className="text-sm font-medium text-primary">Feature</span>
          <h2 className="mt-2 text-3xl font-bold">Feature headline</h2>
          <p className="mt-4 text-muted-foreground">Feature description that explains the benefit.</p>
        </div>
      </section>

      {/* Alternating feature: image right */}
      <section className="bg-muted/50">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <span className="text-sm font-medium text-primary">Feature</span>
            <h2 className="mt-2 text-3xl font-bold">Another feature headline</h2>
            <p className="mt-4 text-muted-foreground">Another description.</p>
          </div>
          <div className="order-1 aspect-[4/3] rounded-2xl bg-muted lg:order-2" />
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y bg-card px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center lg:grid-cols-4">
          <div><p className="text-3xl font-bold">10K+</p><p className="mt-1 text-sm text-muted-foreground">Users</p></div>
          <div><p className="text-3xl font-bold">99.9%</p><p className="mt-1 text-sm text-muted-foreground">Uptime</p></div>
          <div><p className="text-3xl font-bold">50+</p><p className="mt-1 text-sm text-muted-foreground">Countries</p></div>
          <div><p className="text-3xl font-bold">4.9</p><p className="mt-1 text-sm text-muted-foreground">Rating</p></div>
        </div>
      </section>

      {/* Full-bleed CTA */}
      <section className="bg-foreground px-4 py-20 text-center text-background">
        <h2 className="text-3xl font-bold">Ready to transform your workflow?</h2>
        <button className="mt-8 rounded-full bg-background px-8 py-3 font-medium text-foreground">Start Free Trial</button>
      </section>
    </div>
  );
}
```

---

## Breakpoint Quick Reference

| Prefix | Min Width | Common Use |
|--------|-----------|------------|
| `sm:` | 640px | Stack to 2-col |
| `md:` | 768px | Show sidebar nav |
| `lg:` | 1024px | 3-col grids, full layouts |
| `xl:` | 1280px | Wide content areas |
| `2xl:` | 1536px | Max-width containers |

**Pattern:** Start mobile-first, add breakpoints going up. Use `max-w-6xl mx-auto px-4 sm:px-6` as the standard content container.
