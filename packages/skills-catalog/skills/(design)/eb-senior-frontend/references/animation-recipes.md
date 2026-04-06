# Animation Recipes Reference

Copy-paste animation patterns. Each includes Framer Motion and CSS-only versions where applicable.

---

## 1. Page Load Stagger

### Framer Motion

```tsx
"use client";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function StaggerList({ children }: { children: React.ReactNode[] }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {children.map((child, i) => (
        <motion.div key={i} variants={item}>{child}</motion.div>
      ))}
    </motion.div>
  );
}
```

### CSS Only

```css
.stagger-item {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.4s ease-out forwards;
}
.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 100ms; }
.stagger-item:nth-child(3) { animation-delay: 200ms; }
.stagger-item:nth-child(4) { animation-delay: 300ms; }
.stagger-item:nth-child(5) { animation-delay: 400ms; }

@keyframes fadeUp {
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 2. Scroll-Triggered Reveal

### Framer Motion (with whileInView)

```tsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
  {children}
</motion.div>
```

### CSS + Intersection Observer

```tsx
"use client";
import { useEffect, useRef, useState } from "react";

export function ScrollReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: "-100px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`}
    >
      {children}
    </div>
  );
}
```

---

## 3. Parallax Section

### CSS Scroll

```tsx
<section className="relative h-[60vh] overflow-hidden">
  <div
    className="absolute inset-0 bg-cover bg-center bg-fixed"
    style={{ backgroundImage: "url(/hero.jpg)" }}
  />
  <div className="relative z-10 flex h-full items-center justify-center bg-black/40">
    <h2 className="text-4xl font-bold text-white">Parallax Title</h2>
  </div>
</section>
```

### Framer Motion (scroll-driven)

```tsx
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Parallax({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  return (
    <div ref={ref} className="relative h-[60vh] overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-[-20%] bg-cover bg-center" />
      <div className="relative z-10 flex h-full items-center justify-center">{children}</div>
    </div>
  );
}
```

---

## 4. Magnetic Cursor Effect

```tsx
"use client";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";

export function MagneticButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  };
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      className="rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium"
    >
      {children}
    </motion.button>
  );
}
```

---

## 5. Morphing Shape (SVG)

```tsx
"use client";
import { motion } from "framer-motion";

const paths = [
  "M 0,100 C 50,0 100,200 200,100 C 300,0 350,200 400,100 L 400,300 L 0,300 Z",
  "M 0,150 C 80,80 150,250 250,120 C 320,50 370,220 400,150 L 400,300 L 0,300 Z",
];

export function MorphBlob() {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-auto fill-primary/20">
      <motion.path
        d={paths[0]}
        animate={{ d: paths }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
    </svg>
  );
}
```

---

## 6. Number Count-Up

```tsx
"use client";
import { useEffect, useRef, useState } from "react";

export function CountUp({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let start = 0;
      const step = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        setCount(Math.floor(progress * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      observer.disconnect();
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref} className="tabular-nums">{count.toLocaleString()}</span>;
}
```

---

## 7. Typewriter Effect

```tsx
"use client";
import { useState, useEffect } from "react";

export function Typewriter({ words, speed = 80, pause = 2000 }: { words: string[]; speed?: number; pause?: number }) {
  const [text, setText] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, text.length + 1));
        if (text.length + 1 === word.length) setTimeout(() => setDeleting(true), pause);
      } else {
        setText(word.slice(0, text.length - 1));
        if (text.length === 0) { setDeleting(false); setWordIdx((i) => (i + 1) % words.length); }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [text, deleting, wordIdx, words, speed, pause]);

  return <span>{text}<span className="animate-pulse">|</span></span>;
}
```

---

## 8. Hover Card Lift with Shadow

### CSS (Tailwind)

```html
<div class="rounded-xl border bg-card p-6 transition-all duration-300
            hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
  Card content
</div>
```

### Framer Motion

```tsx
<motion.div
  whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
  className="rounded-xl border bg-card p-6"
>
  Card content
</motion.div>
```

---

## 9. Accordion Open/Close with Spring

```tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";

export function AnimatedAccordion({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 10. Tab Switching with Layout Animation

```tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";

const tabs = ["Overview", "Features", "Pricing"];

export function AnimatedTabs() {
  const [active, setActive] = useState(tabs[0]);
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <button key={tab} onClick={() => setActive(tab)} className="relative rounded-md px-4 py-2 text-sm font-medium">
          {active === tab && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 rounded-md bg-background shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab}</span>
        </button>
      ))}
    </div>
  );
}
```

---

## 11. Image Reveal on Scroll

```tsx
<motion.div
  initial={{ clipPath: "inset(100% 0 0 0)" }}
  whileInView={{ clipPath: "inset(0% 0 0 0)" }}
  viewport={{ once: true }}
  transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
>
  <img src="/image.jpg" alt="" className="w-full rounded-xl" />
</motion.div>
```

### CSS Only

```css
.reveal-image {
  clip-path: inset(100% 0 0 0);
  animation: revealUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}
@keyframes revealUp {
  to { clip-path: inset(0% 0 0 0); }
}
```

---

## 12. Navbar Scroll Hide/Show

```tsx
"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function ScrollNavbar({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY && y > 80);
      setLastY(y);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastY]);

  return (
    <header className={cn(
      "sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm transition-transform duration-300",
      hidden ? "-translate-y-full" : "translate-y-0"
    )}>
      {children}
    </header>
  );
}
```

---

## 13. Skeleton Loading Shimmer

### CSS Only (Tailwind)

```html
<div class="space-y-4 animate-pulse">
  <div class="h-4 w-3/4 rounded bg-muted"></div>
  <div class="h-4 w-1/2 rounded bg-muted"></div>
  <div class="h-32 rounded-xl bg-muted"></div>
</div>
```

### Custom shimmer gradient

```css
.skeleton {
  background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 14. Toast / Notification Slide-In

### Framer Motion

```tsx
<motion.div
  initial={{ x: "100%", opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: "100%", opacity: 0 }}
  transition={{ type: "spring", stiffness: 400, damping: 30 }}
  className="fixed bottom-4 right-4 z-50 rounded-lg border bg-card p-4 shadow-lg"
>
  <p className="text-sm font-medium">Changes saved successfully.</p>
</motion.div>
```

### CSS Only

```css
.toast-enter {
  animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.toast-exit {
  animation: slideOutRight 0.2s ease-in forwards;
}
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOutRight {
  to { transform: translateX(100%); opacity: 0; }
}
```

---

## 15. Modal Backdrop Blur

### Framer Motion

```tsx
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-xl w-full max-w-md"
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### CSS Only

```css
.backdrop {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}
.modal {
  animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes modalIn {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
```

---

## Easing Reference

| Name | CSS | Framer Motion | Use Case |
|------|-----|--------------|----------|
| Ease out | `cubic-bezier(0, 0, 0.2, 1)` | `"easeOut"` | Entrances |
| Ease in-out | `cubic-bezier(0.4, 0, 0.2, 1)` | `"easeInOut"` | Transitions |
| Spring | N/A | `{ type: "spring", stiffness: 300, damping: 30 }` | Interactive |
| Sharp | `cubic-bezier(0.16, 1, 0.3, 1)` | `[0.16, 1, 0.3, 1]` | Modals, popups |
| Bounce | N/A | `{ type: "spring", stiffness: 400, damping: 15 }` | Playful |
