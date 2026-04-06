# Inspiration Patterns Reference

Real design patterns from top design galleries, with Tailwind + shadcn/ui implementation code.

---

## Navbar Patterns

### Transparent-to-Solid on Scroll

```tsx
"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function TransparentNavbar({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 z-50 w-full transition-all duration-300",
      scrolled
        ? "border-b bg-background/90 backdrop-blur-md shadow-sm"
        : "bg-transparent"
    )}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {children}
      </div>
    </header>
  );
}
```

### Centered Logo Navbar

```tsx
<header className="border-b">
  <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
    <nav className="hidden gap-6 md:flex">
      <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Products</a>
      <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Solutions</a>
    </nav>
    <a href="/" className="absolute left-1/2 -translate-x-1/2 text-xl font-bold">Logo</a>
    <div className="hidden items-center gap-4 md:flex">
      <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Sign in</a>
      <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Get Started</button>
    </div>
  </div>
</header>
```

### Mega Menu

```tsx
"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

const megaMenuItems = {
  Products: [
    { title: "Analytics", desc: "Track user behavior", href: "#" },
    { title: "Automation", desc: "Workflows on autopilot", href: "#" },
    { title: "Security", desc: "Enterprise-grade protection", href: "#" },
    { title: "Integrations", desc: "Connect your stack", href: "#" },
  ],
};

export function MegaMenuNavbar() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <header className="relative border-b bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
        <span className="text-xl font-bold">Logo</span>
        <nav className="hidden md:flex">
          {Object.entries(megaMenuItems).map(([label, items]) => (
            <div key={label} onMouseEnter={() => setOpen(label)} onMouseLeave={() => setOpen(null)}>
              <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{label}</button>
              <div className={cn(
                "absolute left-0 top-full w-full border-b bg-background shadow-lg transition-all duration-200",
                open === label ? "visible opacity-100" : "invisible opacity-0"
              )}>
                <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 p-6 lg:grid-cols-4">
                  {items.map((item) => (
                    <a key={item.title} href={item.href} className="rounded-lg p-4 hover:bg-muted transition-colors">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
```

### Mobile Drawer

```tsx
"use client";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="rounded-md p-2 hover:bg-muted md:hidden"><Menu className="h-5 w-5" /></button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-16 items-center border-b px-6">
          <span className="font-bold">Logo</span>
        </div>
        <nav className="flex flex-col p-4">
          <a href="#" className="rounded-lg px-4 py-3 text-sm font-medium hover:bg-muted">Home</a>
          <a href="#" className="rounded-lg px-4 py-3 text-sm font-medium hover:bg-muted">Products</a>
          <a href="#" className="rounded-lg px-4 py-3 text-sm font-medium hover:bg-muted">Pricing</a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

### Sticky with Reading Progress Bar

```tsx
"use client";
import { useScroll, useSpring, motion } from "framer-motion";

export function ProgressNavbar({ children }: { children: React.ReactNode }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">{children}</div>
      <motion.div className="h-0.5 bg-primary origin-left" style={{ scaleX }} />
    </header>
  );
}
```

---

## CTA Patterns

### Full-Bleed CTA

```tsx
<section className="bg-primary px-4 py-20 text-center text-primary-foreground sm:px-6">
  <div className="mx-auto max-w-2xl">
    <h2 className="text-3xl font-bold sm:text-4xl">Ready to get started?</h2>
    <p className="mx-auto mt-4 max-w-lg opacity-90">Join thousands of developers who ship faster.</p>
    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <button className="w-full rounded-lg bg-background px-8 py-3 font-medium text-foreground sm:w-auto">Start Free Trial</button>
      <button className="w-full rounded-lg border border-primary-foreground/30 px-8 py-3 font-medium sm:w-auto">Talk to Sales</button>
    </div>
  </div>
</section>
```

### Inline CTA (within content)

```tsx
<div className="my-12 rounded-2xl border bg-gradient-to-r from-primary/5 to-accent/5 p-8 text-center sm:p-12">
  <h3 className="text-xl font-bold">Want to dive deeper?</h3>
  <p className="mt-2 text-muted-foreground">Get the complete guide with 50+ examples.</p>
  <button className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">Download Free Guide</button>
</div>
```

### Floating CTA

```tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <button className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg hover:shadow-xl transition-shadow">
            Get Started Free
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Social Proof CTA

```tsx
<section className="border-y bg-muted/50 px-4 py-16 text-center sm:px-6">
  <div className="mx-auto max-w-2xl">
    {/* Avatars */}
    <div className="flex justify-center -space-x-3">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted" />
      ))}
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-primary text-xs font-bold text-primary-foreground">+2k</div>
    </div>
    <p className="mt-4 text-sm text-muted-foreground">Trusted by 2,000+ engineering teams worldwide</p>
    <h3 className="mt-4 text-2xl font-bold">Start shipping faster today</h3>
    <button className="mt-6 rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground">Start Free &mdash; No Credit Card</button>
    <p className="mt-3 text-xs text-muted-foreground">14-day free trial. Cancel anytime.</p>
  </div>
</section>
```

---

## Landing Page Patterns

### Above-the-Fold Hook (Badge + H1 + Social Proof)

```tsx
<section className="mx-auto max-w-6xl px-4 pt-20 text-center sm:px-6 lg:pt-32">
  <span className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium">
    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Now in public beta
  </span>
  <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
    Ship features, not <span className="text-primary">infrastructure</span>
  </h1>
  <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
    The developer platform that handles the boring stuff so you can focus on building.
  </p>
  <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
    <button className="w-full rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground sm:w-auto">Get Started Free</button>
    <button className="w-full rounded-lg border px-8 py-3 font-medium sm:w-auto">See Demo</button>
  </div>
  {/* Social proof strip */}
  <div className="mt-12 flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale">
    {["Vercel", "Stripe", "Linear", "Notion"].map(name => (
      <span key={name} className="text-sm font-medium">{name}</span>
    ))}
  </div>
</section>
```

### Feature Grid (Bento Style)

```tsx
<section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
  <h2 className="text-center text-3xl font-bold">Everything you need</h2>
  <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {/* Large feature card */}
    <div className="row-span-2 rounded-2xl border bg-card p-8">
      <div className="mb-6 h-48 rounded-xl bg-muted" />
      <h3 className="text-lg font-semibold">Primary Feature</h3>
      <p className="mt-2 text-sm text-muted-foreground">Detailed description of the main feature.</p>
    </div>
    {/* Small feature cards */}
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">A</div>
      <h3 className="font-semibold">Feature B</h3>
      <p className="mt-1 text-sm text-muted-foreground">Brief description.</p>
    </div>
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">C</div>
      <h3 className="font-semibold">Feature C</h3>
      <p className="mt-1 text-sm text-muted-foreground">Brief description.</p>
    </div>
    {/* Wide feature card */}
    <div className="rounded-2xl border bg-card p-6 sm:col-span-2">
      <h3 className="font-semibold">Wide Feature</h3>
      <p className="mt-1 text-sm text-muted-foreground">This feature spans two columns.</p>
    </div>
  </div>
</section>
```

### Pricing Toggle (Monthly/Annual)

```tsx
"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function PricingToggle() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-center gap-3">
        <span className={cn("text-sm", !annual ? "font-medium" : "text-muted-foreground")}>Monthly</span>
        <button
          onClick={() => setAnnual(!annual)}
          className={cn("relative h-6 w-11 rounded-full transition-colors", annual ? "bg-primary" : "bg-muted")}
        >
          <span className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            annual ? "translate-x-5" : "translate-x-0.5"
          )} />
        </button>
        <span className={cn("text-sm", annual ? "font-medium" : "text-muted-foreground")}>
          Annual <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Save 20%</span>
        </span>
      </div>
      <div className="mt-8 text-center">
        <span className="text-5xl font-bold">${annual ? "19" : "24"}</span>
        <span className="text-muted-foreground">/mo</span>
      </div>
    </div>
  );
}
```

---

## SaaS Patterns

### Empty State

```tsx
import { Plus, FileText } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">No documents yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first document.</p>
      <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        <Plus className="h-4 w-4" /> New Document
      </button>
    </div>
  );
}
```

### Settings Page Structure

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences.</p>
      </div>
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="jane@example.com" />
                </div>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Animation Patterns

### Page Transition (Framer Motion + Next.js App Router)

```tsx
// app/template.tsx
"use client";
import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

### Micro-Interaction: Button with Loading State

```tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check } from "lucide-react";

export function LoadingButton({ children, onClick }: { children: React.ReactNode; onClick: () => Promise<void> }) {
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");

  const handleClick = async () => {
    setState("loading");
    await onClick();
    setState("success");
    setTimeout(() => setState("idle"), 1500);
  };

  return (
    <button
      onClick={handleClick}
      disabled={state !== "idle"}
      className="relative inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-80"
    >
      <AnimatePresence mode="wait">
        {state === "idle" && <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{children}</motion.span>}
        {state === "loading" && <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Loader2 className="h-4 w-4 animate-spin" /></motion.span>}
        {state === "success" && <motion.span key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><Check className="h-4 w-4" /></motion.span>}
      </AnimatePresence>
    </button>
  );
}
```

### Scroll-Driven Narrative (Progress-based sections)

```tsx
"use client";
import { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

const steps = [
  { title: "Step 1", description: "First thing happens" },
  { title: "Step 2", description: "Then this" },
  { title: "Step 3", description: "Finally this" },
];

export function ScrollNarrative() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  return (
    <div ref={containerRef} className="relative" style={{ height: `${steps.length * 100}vh` }}>
      <div className="sticky top-0 flex h-screen items-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {steps.map((step, i) => {
            const start = i / steps.length;
            const end = (i + 1) / steps.length;
            return (
              <ScrollStep key={i} progress={scrollYProgress} start={start} end={end} step={step} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScrollStep({ progress, start, end, step }: any) {
  const opacity = useTransform(progress, [start, start + 0.1, end - 0.1, end], [0, 1, 1, 0]);
  const y = useTransform(progress, [start, start + 0.1, end - 0.1, end], [40, 0, 0, -40]);

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col items-center justify-center text-center">
      <h2 className="text-4xl font-bold">{step.title}</h2>
      <p className="mt-4 text-lg text-muted-foreground">{step.description}</p>
    </motion.div>
  );
}
```

---

## Design System Patterns

### Token Architecture (CSS Variables + Tailwind)

```css
/* globals.css */
@layer base {
  :root {
    /* Spacing scale */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --space-8: 2rem;

    /* Radius scale */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --radius-2xl: 1.5rem;

    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);

    /* Colors (HSL for alpha support) */
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --primary: 221 83% 53%;
    --muted: 210 40% 96%;
    --border: 214 32% 91%;
  }
  .dark {
    --background: 222 47% 4%;
    --foreground: 210 40% 98%;
    --primary: 217 91% 60%;
    --muted: 217 33% 17%;
    --border: 217 19% 27%;
  }
}
```

### Variant System (CVA Pattern)

```tsx
// lib/variants.ts
import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export const inputVariants = cva(
  "flex w-full rounded-md border bg-background px-3 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-8 text-xs",
        md: "h-10",
        lg: "h-12 text-base",
      },
      state: {
        default: "border-input",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-emerald-500 focus-visible:ring-emerald-500",
      },
    },
    defaultVariants: { size: "md", state: "default" },
  }
);
```

### Component Documentation Pattern

When building a design system, document each component inline:

```tsx
/**
 * Badge - Displays a small status indicator.
 *
 * @variant default - Primary brand color fill
 * @variant secondary - Subtle muted background
 * @variant destructive - Red for errors/danger
 * @variant outline - Border only, transparent fill
 * @variant success - Green for positive states
 * @variant warning - Amber for caution states
 *
 * @size sm - Compact (10px text)
 * @size md - Standard (12px text)
 * @size lg - Prominent (14px text)
 *
 * @example
 * <Badge variant="success" size="sm">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 */
```

---

## Quick Reference: Pattern to File Mapping

| Pattern | See Also |
|---------|----------|
| Navbar | `layout-patterns.md` (all layouts include navbars) |
| CTA | `templates.md` (SaaS Landing, Marketing) |
| Feature Grid | `layout-patterns.md` (SaaS Landing) |
| Empty State | `templates.md` (Dashboard) |
| Color Tokens | `color-palettes.md` |
| Animations | `animation-recipes.md` |
| Forms | `component-patterns.md` (Form pattern) |
| Data Tables | `component-patterns.md` (TanStack Table) |
