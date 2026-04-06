# Page Templates Reference

10 ready-to-use page templates with component trees, key classes, responsive strategies, animation entry points, and dark mode notes.

---

## 1. SaaS Landing

**Component Tree:**
```
Page
  Navbar (sticky, backdrop-blur)
    Logo | NavLinks (hidden md:flex) | CTAButton
  Hero
    Badge | H1 | Subtitle | ButtonGroup (col sm:row)
  LogoCloud (grayscale opacity-60)
  Features (3-col grid)
    FeatureCard[] (icon + title + desc)
  HowItWorks (numbered steps, alternating layout)
  Testimonials (3-col masonry)
  Pricing (3-col, center highlighted)
  FAQ (Accordion)
  CTA (full-bleed primary bg)
  Footer (4-col grid)
```

**Key Classes:** `max-w-6xl mx-auto px-4 sm:px-6`, hero `py-20 lg:py-32 text-center`, features grid `grid gap-8 sm:grid-cols-2 lg:grid-cols-3`

**Responsive:** Stack everything on mobile. 2-col at `sm:`, 3-col at `lg:`. Hero buttons stack `flex-col` then `sm:flex-row`.

**Animation Points:** Hero badge fade-in, feature cards stagger on scroll, testimonials fade-up, stats count-up, CTA scale on hover.

**Dark Mode:** Use `bg-background`/`text-foreground` CSS vars. Cards use `bg-card`. Highlighted pricing card: `ring-2 ring-primary`.

---

## 2. Dashboard

**Component Tree:**
```
Layout (flex h-screen)
  Sidebar (w-64, collapsible to w-16)
    Logo | NavItems[] | UserMenu
  Main (flex-1 flex-col overflow-hidden)
    Header (h-16, border-b)
      MobileMenuTrigger | SearchBar | NotificationBell | Avatar
    Content (overflow-y-auto p-6)
      StatsRow (4-col grid)
      MainGrid (chart + sidebar: grid lg:grid-cols-[1fr_350px])
      DataTable
```

**Key Classes:** Sidebar `transition-all duration-300`, content `flex-1 overflow-y-auto`, stats `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`

**Responsive:** Sidebar hidden on mobile, sheet/drawer trigger. Stats 1-col -> 2-col -> 4-col. Main grid stacks below `lg:`.

**Animation Points:** Sidebar collapse slide, stat cards number count, chart fade-in, table row hover highlight.

**Dark Mode:** Sidebar `bg-card`, active nav `bg-primary text-primary-foreground`, cards `bg-card border`.

---

## 3. Portfolio

**Component Tree:**
```
Page
  Navbar (minimal, transparent)
  Hero (name + title + short bio)
  FilterBar (category buttons)
  ProjectGrid (masonry or uniform grid)
    ProjectCard[] (image + overlay on hover)
  About (split: image left, text right)
  Contact (simple form or email CTA)
  Footer (social links)
```

**Key Classes:** Masonry `columns-1 sm:columns-2 lg:columns-3 gap-4`, cards `break-inside-avoid mb-4`, overlay `opacity-0 group-hover:opacity-100 transition-opacity`

**Responsive:** 1-col masonry on mobile. Filter bar horizontal scroll with `overflow-x-auto flex gap-2 pb-2`.

**Animation Points:** Project cards scale on hover, image reveal on scroll, filter transition with layout animation, hero text stagger.

**Dark Mode:** Use `bg-background`. Project overlays: `bg-black/70` works in both modes. Hover state: `group-hover:shadow-xl`.

---

## 4. Blog

**Component Tree:**
```
Layout
  Navbar
  Main (max-w-6xl, grid lg:grid-cols-[1fr_250px])
    Article (prose dark:prose-invert)
      Title | Meta (avatar, author, date) | Body | Tags
    TOCSidebar (sticky top-24, hidden lg:block)
      TOCLinks[]
  NewsletterCTA (full-width banner)
  RelatedPosts (3-col grid)
  Footer
```

**Key Classes:** Article `prose prose-neutral dark:prose-invert max-w-none lg:max-w-[680px]`, TOC `sticky top-24`

**Responsive:** TOC hidden below `lg:`, article full width. Related posts 1-col -> 3-col.

**Animation Points:** TOC active link highlight on scroll (Intersection Observer), newsletter CTA slide-up, reading progress bar in header.

**Dark Mode:** `prose-invert` handles article. TOC links `text-muted-foreground hover:text-foreground`. Code blocks get `bg-zinc-900`.

---

## 5. Marketing

**Component Tree:**
```
Page
  Navbar (transparent, scrolls to solid)
  Hero (full-bleed gradient, centered)
  LogoStrip
  AlternatingFeatures[] (image + text, flip order)
  StatsStrip (4-col centered numbers)
  Testimonial (single large quote, centered)
  CTA (dark bg, contrasting button)
  Footer
```

**Key Classes:** Full-bleed `w-full`, constrained inner `max-w-6xl mx-auto px-4 sm:px-6`, alternating `lg:grid-cols-2`, flip `order-2 lg:order-1`

**Responsive:** Alternating features stack. Image always on top on mobile (use `order-` classes). Stats 2-col -> 4-col.

**Animation Points:** Hero parallax, feature images slide-in from sides, stats count-up, testimonial fade, CTA button pulse.

**Dark Mode:** Gradient hero use `from-primary to-primary/60`. Dark sections `bg-foreground text-background`. Stats `bg-card`.

---

## 6. E-commerce Product

**Component Tree:**
```
Page
  Breadcrumbs
  ProductSection (grid lg:grid-cols-2 gap-8)
    ImageGallery (main + thumbnails)
    ProductInfo
      Title | Price | Rating | Description | VariantSelector | QuantityInput | AddToCartButton
  Tabs (Description | Reviews | Shipping)
  RelatedProducts (4-col scroll on mobile)
  Footer
```

**Key Classes:** Gallery `aspect-square rounded-xl overflow-hidden`, thumbnails `grid grid-cols-4 gap-2`, product info `space-y-4`

**Responsive:** Image gallery above product info on mobile. Thumbnails 4-col always. Related products horizontal scroll `flex gap-4 overflow-x-auto snap-x` on mobile, grid on desktop.

**Animation Points:** Image zoom on hover, thumbnail swap fade, add-to-cart button bounce, variant selector highlight, related product cards hover lift.

**Dark Mode:** Product images unaffected. Cards `bg-card`. Price `text-foreground`. Sale price `text-destructive`.

---

## 7. Auth Pages (Login/Register)

**Component Tree:**
```
Page (min-h-screen flex)
  LeftPanel (hidden lg:flex, brand/illustration)
  RightPanel (flex items-center justify-center)
    AuthCard (w-full max-w-sm)
      Logo | Title | Subtitle
      SocialButtons (Google, GitHub)
      Divider ("or continue with")
      Form (email + password inputs)
      SubmitButton
      FooterLink ("Don't have an account?")
```

**Key Classes:** Split layout `grid lg:grid-cols-2 min-h-screen`, right panel `flex items-center justify-center p-8`, form card `w-full max-w-sm space-y-6`

**Responsive:** Left panel hidden below `lg:`. Form centered with `mx-auto`.

**Animation Points:** Form fields stagger-in, social buttons hover scale, submit button loading spinner, error shake.

**Dark Mode:** Left panel can use dark gradient regardless. Form `bg-card` with `border`. Input `bg-background`.

---

## 8. Settings

**Component Tree:**
```
DashboardLayout
  SettingsPage
    Header (title + description)
    Navigation (tabs or sidebar)
      TabsList (horizontal sm, vertical lg)
    Content
      SettingsSection[]
        SectionTitle | SectionDescription
        SettingsForm (fields in a card)
          FormField[] | SaveButton
      DangerZone (destructive bordered card)
```

**Key Classes:** Settings nav `flex gap-1 overflow-x-auto sm:flex-col sm:w-48`, content `flex-1 space-y-6`, section card `rounded-xl border p-6`

**Responsive:** Tabs horizontal scroll on mobile, vertical sidebar on desktop. Form fields full-width on mobile, 2-col `sm:grid-cols-2` on desktop.

**Animation Points:** Tab switch content fade, save button success checkmark, danger zone expand, toast notification on save.

**Dark Mode:** Danger zone `border-destructive/50 bg-destructive/5`. Standard cards `bg-card`.

---

## 9. Pricing Page

**Component Tree:**
```
Page
  Navbar
  Hero (title + subtitle + billing toggle)
  PricingGrid (3-col, center highlighted)
    PricingCard[]
      PlanName | Price | BillingPeriod | FeatureList | CTAButton
  ComparisonTable (hidden on mobile, scrollable)
  FAQ (Accordion)
  CTA (full-bleed)
  Footer
```

**Key Classes:** Pricing grid `grid gap-8 sm:grid-cols-2 lg:grid-cols-3`, highlighted card `ring-2 ring-primary scale-105`, toggle `inline-flex rounded-full bg-muted p-1`

**Responsive:** 1-col -> 2-col -> 3-col. Comparison table horizontal scroll on mobile with `overflow-x-auto`. FAQ full-width.

**Animation Points:** Price number morph on billing toggle, card hover lift, feature list stagger, FAQ accordion spring.

**Dark Mode:** Highlighted card `bg-primary/5 ring-primary`. Feature checks `text-primary`. Disabled features `text-muted-foreground line-through`.

---

## 10. 404 Error

**Component Tree:**
```
Page (min-h-screen flex items-center justify-center)
  Container (max-w-md text-center)
    Illustration (SVG or Lottie animation)
    ErrorCode (text-7xl font-bold text-muted-foreground/20)
    Title ("Page not found")
    Description (text-muted-foreground)
    ButtonGroup
      HomeButton (primary) | BackButton (outline)
    SearchBar (optional)
```

**Key Classes:** `min-h-screen flex items-center justify-center px-4`, error code `text-8xl font-bold text-muted-foreground/20`, buttons `flex flex-col sm:flex-row gap-3 mt-8`

**Responsive:** Everything centered, naturally responsive. Buttons stack on mobile.

**Animation Points:** Illustration loop, error code fade-in, buttons stagger, search bar expand on focus.

**Dark Mode:** Error code `text-muted-foreground/10` (more subtle). Illustration should use currentColor or CSS vars. Background `bg-background`.

---

## Universal Patterns

**Container:** `mx-auto max-w-6xl px-4 sm:px-6 lg:px-8`

**Section spacing:** `py-16 sm:py-20 lg:py-24`

**Card:** `rounded-xl border bg-card p-6 shadow-sm`

**Heading hierarchy:** `text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight`

**Body text:** `text-muted-foreground text-base lg:text-lg max-w-2xl`
