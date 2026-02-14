# Theme Development Reference

Expert guidance for Shopify theme development including file structure, Online Store 2.0 architecture, sections, snippets, and configuration.

## Core Capabilities

### 1. Theme File Structure

Complete directory organisation for Shopify themes:

```
theme/
├── assets/                     {# Static resources #}
│   ├── style.css              {# Main stylesheet #}
│   ├── style.css.liquid       {# Dynamic CSS with Liquid #}
│   ├── theme.js               {# Main JavaScript #}
│   ├── theme.js.liquid        {# Dynamic JS with Liquid #}
│   ├── logo.png               {# Images #}
│   └── fonts/                 {# Custom fonts #}
│
├── config/                     {# Configuration #}
│   ├── settings_schema.json   {# Theme settings UI #}
│   └── settings_data.json     {# Default values #}
│
├── layout/                     {# Master templates #}
│   ├── theme.liquid           {# Main wrapper #}
│   ├── password.liquid        {# Password protection #}
│   └── checkout.liquid        {# Checkout (Plus only) (deprecated - use Checkout Extensibility) #}
│
├── locales/                    {# Translations #}
│   ├── en.default.json        {# English #}
│   └── fr.json                {# French #}
│
├── sections/                   {# Reusable sections #}
│   ├── header.liquid
│   ├── hero-banner.liquid
│   ├── product-card.liquid
│   └── footer.liquid
│
├── snippets/                   {# Reusable partials #}
│   ├── product-price.liquid
│   ├── product-rating.liquid
│   └── icon.liquid
│
└── templates/                  {# Page templates #}
    ├── index.json              {# Homepage (JSON) #}
    ├── product.json            {# Product page (JSON) #}
    ├── collection.json         {# Collection page (JSON) #}
    ├── product.liquid          {# Product (Liquid - legacy) #}
    ├── cart.liquid
    ├── search.liquid
    ├── page.liquid
    ├── 404.liquid
    └── customers/
        ├── account.liquid
        ├── login.liquid
        └── register.liquid
```

**Horizon theme:** Shopify's newest reference theme (2025) - uses container queries, View Transitions API, and CSS custom properties. Replaces Dawn as the recommended starting point for new themes.

### 2. JSON Templates (Online Store 2.0)

Modern template format using JSON configuration:

**templates/index.json (Homepage):**
```json
{
  "sections": {
    "hero": {
      "type": "hero-banner",
      "settings": {
        "heading": "Summer Collection",
        "subheading": "New arrivals",
        "button_text": "Shop Now",
        "button_link": "/collections/all"
      }
    },
    "featured": {
      "type": "featured-products",
      "blocks": {
        "block_1": {
          "type": "product",
          "settings": {
            "product": "snowboard"
          }
        },
        "block_2": {
          "type": "product",
          "settings": {
            "product": "skateboard"
          }
        }
      },
      "block_order": ["block_1", "block_2"],
      "settings": {
        "title": "Featured Products",
        "products_to_show": 4
      }
    }
  },
  "order": ["hero", "featured"]
}
```

**templates/product.json:**
```json
{
  "sections": {
    "main": {
      "type": "main-product",
      "settings": {
        "show_vendor": true,
        "show_quantity": true,
        "enable_zoom": true
      }
    },
    "recommendations": {
      "type": "product-recommendations",
      "settings": {
        "heading": "You may also like",
        "products_to_show": 4
      }
    }
  },
  "order": ["main", "recommendations"]
}
```

### 3. Section Architecture

Sections are reusable content blocks with schema configuration:

**sections/hero-banner.liquid:**
```liquid
<div class="hero" style="background-color: {{ section.settings.background_color }}">
  {% if section.settings.image %}
    <img
      src="{{ section.settings.image | img_url: '1920x' }}"
      alt="{{ section.settings.heading }}"
      loading="lazy"
    >
  {% endif %}

  <div class="hero__content">
    {% if section.settings.heading != blank %}
      <h1>{{ section.settings.heading }}</h1>
    {% endif %}

    {% if section.settings.subheading != blank %}
      <p>{{ section.settings.subheading }}</p>
    {% endif %}

    {% if section.settings.button_text != blank %}
      <a href="{{ section.settings.button_link }}" class="button">
        {{ section.settings.button_text }}
      </a>
    {% endif %}
  </div>
</div>

{% stylesheet %}
  .hero {
    position: relative;
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing, 2rem);
  }

  .hero img {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -1;
  }

  .hero__content {
    text-align: center;
    max-width: 600px;
  }
{% endstylesheet %}

{% javascript %}
  console.log('Hero banner loaded');
{% endjavascript %}

{% schema %}
{
  "name": "Hero Banner",
  "tag": "section",
  "class": "hero-section",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Welcome"
    },
    {
      "type": "textarea",
      "id": "subheading",
      "label": "Subheading",
      "default": "Discover our collection"
    },
    {
      "type": "image_picker",
      "id": "image",
      "label": "Background Image"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background Colour",
      "default": "#000000"
    },
    {
      "type": "text",
      "id": "button_text",
      "label": "Button Text",
      "default": "Shop Now"
    },
    {
      "type": "url",
      "id": "button_link",
      "label": "Button Link"
    }
  ],
  "presets": [
    {
      "name": "Hero Banner"
    }
  ]
}
{% endschema %}
```

### 4. Sections with Blocks

Sections can contain dynamic blocks for flexible layouts:

**sections/featured-products.liquid:**
```liquid
<div class="featured-products" {{ section.shopify_attributes }}>
  <h2>{{ section.settings.title }}</h2>

  <div class="product-grid">
    {% for block in section.blocks %}
      <div class="product-item" {{ block.shopify_attributes }}>
        {% case block.type %}
          {% when 'product' %}
            {% assign product = all_products[block.settings.product] %}
            {% render 'product-card', product: product %}

          {% when 'collection' %}
            {% assign collection = collections[block.settings.collection] %}
            <h3>{{ collection.title }}</h3>
            {% for product in collection.products limit: block.settings.products_to_show %}
              {% render 'product-card', product: product %}
            {% endfor %}

          {% when 'heading' %}
            <h3>{{ block.settings.heading }}</h3>

          {% when 'text' %}
            <div class="text-block">
              {{ block.settings.text }}
            </div>
        {% endcase %}
      </div>
    {% endfor %}
  </div>
</div>

{% schema %}
{
  "name": "Featured Products",
  "tag": "section",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Section Title",
      "default": "Featured Products"
    },
    {
      "type": "range",
      "id": "products_per_row",
      "label": "Products per Row",
      "min": 2,
      "max": 5,
      "step": 1,
      "default": 4
    }
  ],
  "blocks": [
    {
      "type": "product",
      "name": "Product",
      "settings": [
        {
          "type": "product",
          "id": "product",
          "label": "Product"
        }
      ]
    },
    {
      "type": "collection",
      "name": "Collection",
      "settings": [
        {
          "type": "collection",
          "id": "collection",
          "label": "Collection"
        },
        {
          "type": "range",
          "id": "products_to_show",
          "label": "Products to Show",
          "min": 1,
          "max": 12,
          "step": 1,
          "default": 4
        }
      ]
    },
    {
      "type": "heading",
      "name": "Heading",
      "settings": [
        {
          "type": "text",
          "id": "heading",
          "label": "Heading Text"
        }
      ]
    },
    {
      "type": "text",
      "name": "Text Block",
      "settings": [
        {
          "type": "richtext",
          "id": "text",
          "label": "Text Content"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Featured Products",
      "blocks": [
        {
          "type": "product"
        },
        {
          "type": "product"
        },
        {
          "type": "product"
        }
      ]
    }
  ],
  "max_blocks": 12
}
{% endschema %}
```

### 5. Snippets

Reusable template partials:

**snippets/product-card.liquid:**
```liquid
{% comment %}
  Usage: {% render 'product-card', product: product, show_vendor: true %}
{% endcomment %}

<div class="product-card">
  <a href="{{ product.url }}">
    {% if product.featured_image %}
      <img
        src="{{ product.featured_image | img_url: '400x400' }}"
        alt="{{ product.featured_image.alt | escape }}"
        loading="lazy"
      >
    {% else %}
      {{ 'product-1' | placeholder_svg_tag: 'placeholder' }}
    {% endif %}
  </a>

  <div class="product-card__info">
    {% if show_vendor and product.vendor != blank %}
      <p class="product-card__vendor">{{ product.vendor }}</p>
    {% endif %}

    <h3 class="product-card__title">
      <a href="{{ product.url }}">{{ product.title }}</a>
    </h3>

    <div class="product-card__price">
      {% render 'product-price', product: product %}
    </div>

    {% unless product.available %}
      <p class="sold-out">Sold Out</p>
    {% endunless %}
  </div>
</div>
```

**snippets/product-price.liquid:**
```liquid
{% comment %}
  Usage: {% render 'product-price', product: product %}
{% endcomment %}

{% if product.compare_at_price > product.price %}
  <span class="price price--sale">
    {{ product.price | money }}
  </span>
  <span class="price price--compare">
    {{ product.compare_at_price | money }}
  </span>
  <span class="price__badge">
    Save {{ product.compare_at_price | minus: product.price | money }}
  </span>
{% else %}
  <span class="price">
    {{ product.price | money }}
  </span>
{% endif %}

{% if product.price_varies %}
  <span class="price__from">from</span>
{% endif %}
```

### 6. Settings Schema

Complete theme customisation interface:

**config/settings_schema.json:**
```json
[
  {
    "name": "theme_info",
    "theme_name": "My Theme",
    "theme_version": "1.0.0",
    "theme_author": "Your Name",
    "theme_documentation_url": "https://...",
    "theme_support_url": "https://..."
  },
  {
    "name": "Colors",
    "settings": [
      {
        "type": "header",
        "content": "Colour Scheme"
      },
      {
        "type": "color",
        "id": "color_primary",
        "label": "Primary Colour",
        "default": "#000000"
      },
      {
        "type": "color",
        "id": "color_secondary",
        "label": "Secondary Colour",
        "default": "#ffffff"
      },
      {
        "type": "color_background",
        "id": "color_body_bg",
        "label": "Body Background"
      }
    ]
  },
  {
    "name": "Typography",
    "settings": [
      {
        "type": "font_picker",
        "id": "type_header_font",
        "label": "Heading Font",
        "default": "helvetica_n7"
      },
      {
        "type": "font_picker",
        "id": "type_body_font",
        "label": "Body Font",
        "default": "helvetica_n4"
      },
      {
        "type": "range",
        "id": "type_base_size",
        "label": "Base Font Size",
        "min": 12,
        "max": 24,
        "step": 1,
        "default": 16,
        "unit": "px"
      }
    ]
  },
  {
    "name": "Layout",
    "settings": [
      {
        "type": "select",
        "id": "layout_style",
        "label": "Layout Style",
        "options": [
          { "value": "boxed", "label": "Boxed" },
          { "value": "full-width", "label": "Full Width" },
          { "value": "wide", "label": "Wide" }
        ],
        "default": "full-width"
      },
      {
        "type": "checkbox",
        "id": "layout_sidebar_enabled",
        "label": "Enable Sidebar",
        "default": true
      }
    ]
  },
  {
    "name": "Header",
    "settings": [
      {
        "type": "image_picker",
        "id": "logo",
        "label": "Logo"
      },
      {
        "type": "range",
        "id": "logo_max_width",
        "label": "Logo Width",
        "min": 50,
        "max": 300,
        "step": 10,
        "default": 150,
        "unit": "px"
      },
      {
        "type": "link_list",
        "id": "main_menu",
        "label": "Main Menu"
      },
      {
        "type": "checkbox",
        "id": "header_sticky",
        "label": "Sticky Header",
        "default": false
      }
    ]
  },
  {
    "name": "Social Media",
    "settings": [
      {
        "type": "header",
        "content": "Social Accounts"
      },
      {
        "type": "url",
        "id": "social_twitter",
        "label": "Twitter URL",
        "info": "https://twitter.com/username"
      },
      {
        "type": "url",
        "id": "social_facebook",
        "label": "Facebook URL"
      },
      {
        "type": "url",
        "id": "social_instagram",
        "label": "Instagram URL"
      }
    ]
  }
]
```

### 7. Layout Files

Master template wrappers:

**layout/theme.liquid:**
```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">

  <title>
    {{ page_title }}
    {%- if current_tags %} &ndash; {{ 'general.meta.tags' | t: tags: current_tags.join(', ') }}{% endif -%}
    {%- if current_page != 1 %} &ndash; {{ 'general.meta.page' | t: page: current_page }}{% endif -%}
    {%- unless page_title contains shop.name %} &ndash; {{ shop.name }}{% endunless -%}
  </title>

  {{ content_for_header }}

  <link rel="stylesheet" href="{{ 'style.css' | asset_url }}">
  <script src="{{ 'theme.js' | asset_url }}" defer></script>
</head>
<body class="template-{{ request.page_type }}">
  {% section 'header' %}

  <main role="main">
    {{ content_for_layout }}
  </main>

  {% section 'footer' %}
</body>
</html>
```

## Settings Schema Input Types

All 28+ input types for theme customisation in `settings_schema.json` and section schemas.

### Text Inputs

#### text

Single-line text input:

```json
{
  "type": "text",
  "id": "store_name",
  "label": "Store Name",
  "default": "My Store",
  "placeholder": "Enter store name",
  "info": "This appears in the header"
}
```

#### textarea

Multi-line text input:

```json
{
  "type": "textarea",
  "id": "footer_text",
  "label": "Footer Text",
  "default": "© 2025 My Store. All rights reserved.",
  "placeholder": "Enter footer text"
}
```

#### html

HTML code editor:

```json
{
  "type": "html",
  "id": "custom_html",
  "label": "Custom HTML",
  "default": "<p>Welcome to our store!</p>",
  "info": "Add custom HTML code"
}
```

#### richtext

WYSIWYG rich text editor:

```json
{
  "type": "richtext",
  "id": "announcement_content",
  "label": "Announcement Bar Content",
  "default": "<p>Free shipping on orders over $50!</p>"
}
```

### Numeric Inputs

#### number

Numeric input field:

```json
{
  "type": "number",
  "id": "products_per_page",
  "label": "Products Per Page",
  "default": 12,
  "min": 1,
  "max": 100,
  "step": 1,
  "info": "Number of products to show per page"
}
```

#### range

Slider input:

```json
{
  "type": "range",
  "id": "columns",
  "label": "Number of Columns",
  "min": 2,
  "max": 6,
  "step": 1,
  "default": 4,
  "unit": "columns",
  "info": "Adjust the grid layout"
}
```

**Common units:**
- `px` - Pixels
- `%` - Percentage
- `em` - Em units
- `rem` - Root em units
- Custom text (like "columns", "items")

### Boolean Inputs

#### checkbox

Toggle checkbox:

```json
{
  "type": "checkbox",
  "id": "show_search",
  "label": "Show Search Bar",
  "default": true,
  "info": "Display search in header"
}
```

#### boolean

Boolean setting (same as checkbox):

```json
{
  "type": "boolean",
  "id": "enable_feature",
  "label": "Enable Feature",
  "default": false
}
```

### Selection Inputs

#### select

Dropdown menu:

```json
{
  "type": "select",
  "id": "layout_style",
  "label": "Layout Style",
  "options": [
    {
      "value": "boxed",
      "label": "Boxed"
    },
    {
      "value": "full-width",
      "label": "Full Width"
    },
    {
      "value": "wide",
      "label": "Wide"
    }
  ],
  "default": "full-width",
  "info": "Choose your layout style"
}
```

#### radio

Radio button selection:

```json
{
  "type": "radio",
  "id": "text_alignment",
  "label": "Text Alignment",
  "options": [
    { "value": "left", "label": "Left" },
    { "value": "center", "label": "Centre" },
    { "value": "right", "label": "Right" }
  ],
  "default": "center"
}
```

### Colour Inputs

#### color

Colour picker:

```json
{
  "type": "color",
  "id": "primary_color",
  "label": "Primary Colour",
  "default": "#000000",
  "info": "Main brand colour"
}
```

#### color_background

Colour with gradient support:

```json
{
  "type": "color_background",
  "id": "section_background",
  "label": "Section Background",
  "default": "linear-gradient(#ffffff, #000000)"
}
```

**Supports:**
- Solid colours: `#ffffff`
- Linear gradients: `linear-gradient(#fff, #000)`
- Radial gradients
- With opacity

### Media Inputs

#### image_picker

Image upload and selection:

```json
{
  "type": "image_picker",
  "id": "logo",
  "label": "Logo Image",
  "info": "Recommended size: 300x100px"
}
```

Access in Liquid:

```liquid
{% if settings.logo %}
  <img src="{{ settings.logo | img_url: '300x' }}" alt="{{ shop.name }}">
{% endif %}

{{ settings.logo.width }}
{{ settings.logo.height }}
{{ settings.logo.alt }}
{{ settings.logo.src }}
```

#### media

Image or video picker:

```json
{
  "type": "media",
  "id": "hero_media",
  "label": "Hero Media",
  "accept": ["image", "video"],
  "info": "Upload image or video"
}
```

#### video_url

Video URL input (YouTube, Vimeo):

```json
{
  "type": "video_url",
  "id": "promo_video",
  "label": "Promo Video",
  "accept": ["youtube", "vimeo"],
  "placeholder": "https://www.youtube.com/watch?v=...",
  "info": "YouTube or Vimeo URL"
}
```

Access in Liquid:

```liquid
{% if settings.promo_video %}
  {{ settings.promo_video.type }}  {# youtube or vimeo #}
  {{ settings.promo_video.id }}    {# Video ID #}
{% endif %}
```

### Typography Inputs

#### font_picker

Google Fonts selector:

```json
{
  "type": "font_picker",
  "id": "heading_font",
  "label": "Heading Font",
  "default": "helvetica_n7",
  "info": "Font for headings"
}
```

**Font format:** `family_weight`
- `n4` - Normal 400
- `n7` - Bold 700
- `i4` - Italic 400

Access in Liquid:

```liquid
{{ settings.heading_font.family }}
{{ settings.heading_font.weight }}
{{ settings.heading_font.style }}

{# CSS font face #}
<style>
  {{ settings.heading_font | font_face }}

  h1, h2, h3 {
    font-family: {{ settings.heading_font.family }}, {{ settings.heading_font.fallback_families }};
    font-weight: {{ settings.heading_font.weight }};
    font-style: {{ settings.heading_font.style }};
  }
</style>
```

### Resource Pickers

#### product

Product selector:

```json
{
  "type": "product",
  "id": "featured_product",
  "label": "Featured Product",
  "info": "Select a product to feature"
}
```

Access in Liquid:

```liquid
{% assign product = all_products[settings.featured_product] %}
{{ product.title }}
{{ product.price | money }}
```

#### collection

Collection selector:

```json
{
  "type": "collection",
  "id": "featured_collection",
  "label": "Featured Collection",
  "info": "Select a collection to feature"
}
```

Access in Liquid:

```liquid
{% assign collection = collections[settings.featured_collection] %}
{{ collection.title }}
{% for product in collection.products limit: 4 %}
  {{ product.title }}
{% endfor %}
```

#### page

Page selector:

```json
{
  "type": "page",
  "id": "about_page",
  "label": "About Page",
  "info": "Link to about page"
}
```

Access in Liquid:

```liquid
{% assign page = pages[settings.about_page] %}
<a href="{{ page.url }}">{{ page.title }}</a>
{{ page.content }}
```

#### blog

Blog selector:

```json
{
  "type": "blog",
  "id": "main_blog",
  "label": "Main Blog",
  "info": "Select your primary blog"
}
```

Access in Liquid:

```liquid
{% assign blog = blogs[settings.main_blog] %}
{{ blog.title }}
{% for article in blog.articles limit: 3 %}
  {{ article.title }}
{% endfor %}
```

#### article

Article (blog post) selector:

```json
{
  "type": "article",
  "id": "featured_article",
  "label": "Featured Article",
  "info": "Select an article to feature"
}
```

#### link_list

Menu/navigation selector:

```json
{
  "type": "link_list",
  "id": "main_menu",
  "label": "Main Navigation",
  "default": "main-menu",
  "info": "Select menu for header"
}
```

Access in Liquid:

```liquid
{% assign menu = linklists[settings.main_menu] %}
{% for link in menu.links %}
  <a href="{{ link.url }}">{{ link.title }}</a>

  {% if link.links.size > 0 %}
    {# Nested links #}
    {% for child_link in link.links %}
      <a href="{{ child_link.url }}">{{ child_link.title }}</a>
    {% endfor %}
  {% endif %}
{% endfor %}
```

### URL Inputs

#### url

URL input field:

```json
{
  "type": "url",
  "id": "twitter_url",
  "label": "Twitter URL",
  "placeholder": "https://twitter.com/username",
  "info": "Your Twitter profile URL"
}
```

### Date & Time Inputs

#### date

Date picker:

```json
{
  "type": "date",
  "id": "sale_end_date",
  "label": "Sale End Date",
  "info": "When the sale ends"
}
```

Access in Liquid:

```liquid
{{ settings.sale_end_date | date: '%B %d, %Y' }}
```

### Organisation Elements

#### header

Visual separator with heading:

```json
{
  "type": "header",
  "content": "Colour Scheme Settings",
  "info": "Configure your colour palette"
}
```

Not a setting, just a visual divider in the settings panel.

#### paragraph

Informational text block:

```json
{
  "type": "paragraph",
  "content": "These settings control the appearance of your product cards. Make sure to preview changes on different screen sizes."
}
```

### Advanced Inputs

#### liquid

Liquid code editor:

```json
{
  "type": "liquid",
  "id": "custom_liquid",
  "label": "Custom Liquid Code",
  "info": "Add custom Liquid code"
}
```

#### inline_richtext

Inline rich text (no `<p>` wrapper):

```json
{
  "type": "inline_richtext",
  "id": "banner_text",
  "label": "Banner Text",
  "default": "Welcome to <strong>our store</strong>!",
  "info": "Text without paragraph wrapper"
}
```

## Best Practices

1. **Use JSON templates** for Online Store 2.0 compatibility
2. **Make sections dynamic** with blocks for merchant flexibility
3. **Add `shopify_attributes`** to section/block containers for theme editor
4. **Provide sensible defaults** in schema settings
5. **Use snippets** for repeated UI components
6. **Add `{% stylesheet %}` and `{% javascript %}`** blocks in sections for scoped styles
7. **Include accessibility** attributes (ARIA labels, alt text)
8. **Test in theme editor** to ensure live preview works
9. **Document snippet parameters** with comments
10. **Use semantic HTML** for better SEO
11. **Group related settings** into logical sections
12. **Provide clear labels and info text** for guidance
13. **Use appropriate input types** for each setting
14. **Add placeholder text** for URL and text inputs
15. **Use headers and paragraphs** to organise complex sections
16. **Limit range values** to reasonable min/max
17. **Test in theme customiser** to ensure good UX
18. **Document dependencies** between settings
19. **Consider mobile experience** when choosing input types
