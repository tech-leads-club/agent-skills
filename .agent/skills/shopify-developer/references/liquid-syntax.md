# Liquid Syntax Reference

## Tag Categories

### Control Flow Tags

#### if/elsif/else/endif

```liquid
{% if product.available %}
  <button>Add to Cart</button>
{% elsif product.coming_soon %}
  <p>Coming Soon</p>
{% else %}
  <p>Sold Out</p>
{% endif %}
```

**Operators:**
- `==` - equals
- `!=` - not equals
- `>` - greater than
- `<` - less than
- `>=` - greater than or equal
- `<=` - less than or equal
- `contains` - substring or array contains
- `and` - logical AND
- `or` - logical OR

**Examples:**
```liquid
{% if product.price > 100 and product.available %}
  Premium item in stock
{% endif %}

{% if product.tags contains 'sale' or product.type == 'clearance' %}
  On sale!
{% endif %}
```

#### unless

Negated if statement:

```liquid
{% unless customer.name == blank %}
  Hello, {{ customer.name }}
{% endunless %}

{# Equivalent to: #}
{% if customer.name != blank %}
  Hello, {{ customer.name }}
{% endif %}
```

#### case/when

Switch-case statement:

```liquid
{% case product.type %}
  {% when 'shoes' %}
    <icon>👟</icon>
  {% when 'boots' %}
    <icon>👢</icon>
  {% when 'sneakers' %}
    <icon>👟</icon>
  {% else %}
    <icon>📦</icon>
{% endcase %}
```

### Iteration Tags

#### for loop

```liquid
{% for product in collection.products %}
  {{ product.title }}
{% endfor %}
```

**Modifiers:**

```liquid
{# Limit to first 5 #}
{% for product in collection.products limit: 5 %}
  {{ product.title }}
{% endfor %}

{# Skip first 10 #}
{% for product in collection.products offset: 10 %}
  {{ product.title }}
{% endfor %}

{# Reverse order #}
{% for product in collection.products reversed %}
  {{ product.title }}
{% endfor %}

{# Combine modifiers #}
{% for product in collection.products limit: 5 offset: 10 %}
  {# Items 11-15 #}
{% endfor %}
```

**forloop object (available inside loops):**

```liquid
{% for item in array %}
  {{ forloop.index }}        {# 1-based: 1, 2, 3, ... #}
  {{ forloop.index0 }}       {# 0-based: 0, 1, 2, ... #}
  {{ forloop.rindex }}       {# Reverse 1-based: 3, 2, 1 #}
  {{ forloop.rindex0 }}      {# Reverse 0-based: 2, 1, 0 #}
  {{ forloop.first }}        {# true on first iteration #}
  {{ forloop.last }}         {# true on last iteration #}
  {{ forloop.length }}       {# Total number of items #}
{% endfor %}
```

**Example usage:**

```liquid
{% for product in collection.products %}
  {% if forloop.first %}
    <h2>Featured Product</h2>
  {% endif %}

  <div class="product-{{ forloop.index }}">
    {{ product.title }}
  </div>

  {% if forloop.index == 3 %}
    <hr> {# Divider after 3rd item #}
  {% endif %}

  {% if forloop.last %}
    <p>Showing {{ forloop.length }} products</p>
  {% endif %}
{% endfor %}
```

#### break and continue

```liquid
{% for product in collection.products %}
  {% if product.handle == 'target' %}
    {% break %}  {# Exit loop entirely #}
  {% endif %}

  {% if product.available == false %}
    {% continue %}  {# Skip to next iteration #}
  {% endif %}

  {{ product.title }}
{% endfor %}
```

#### tablerow

Creates HTML table rows:

```liquid
{% tablerow product in collection.products cols: 3 %}
  {{ product.title }}
{% endtablerow %}

{# Output: #}
<table>
  <tr class="row1">
    <td class="col1">Product 1</td>
    <td class="col2">Product 2</td>
    <td class="col3">Product 3</td>
  </tr>
  <tr class="row2">
    <td class="col1">Product 4</td>
    ...
  </tr>
</table>
```

**tablerow object:**

```liquid
{% tablerow product in products cols: 3 limit: 12 %}
  {{ tablerow.col }}         {# Current column (1-based) #}
  {{ tablerow.col0 }}        {# Current column (0-based) #}
  {{ tablerow.row }}         {# Current row (1-based) #}
  {{ tablerow.index }}       {# Item index (1-based) #}
  {{ tablerow.first }}       {# true on first item #}
  {{ tablerow.last }}        {# true on last item #}
  {{ tablerow.col_first }}   {# true on first column #}
  {{ tablerow.col_last }}    {# true on last column #}
{% endtablerow %}
```

#### paginate

For paginating large collections:

```liquid
{% paginate collection.products by 12 %}

  {% for product in paginate.collection.products %}
    {% render 'product-card', product: product %}
  {% endfor %}

  {# Pagination controls #}
  {% if paginate.pages > 1 %}
    {{ paginate | default_pagination }}
  {% endif %}

{% endpaginate %}
```

**paginate object:**

```liquid
{{ paginate.current_page }}      {# Current page number #}
{{ paginate.pages }}              {# Total pages #}
{{ paginate.items }}              {# Total items #}
{{ paginate.page_size }}          {# Items per page #}

{{ paginate.previous.url }}       {# Previous page URL (if exists) #}
{{ paginate.previous.title }}     {# Previous page title #}
{{ paginate.previous.is_link }}   {# Boolean #}

{{ paginate.next.url }}           {# Next page URL (if exists) #}
{{ paginate.next.title }}         {# Next page title #}
{{ paginate.next.is_link }}       {# Boolean #}

{{ paginate.parts }}              {# Array of page links #}
```

**Custom pagination:**

```liquid
{% paginate collection.products by 20 %}

  <div class="pagination">
    {% if paginate.previous %}
      <a href="{{ paginate.previous.url }}">← Previous</a>
    {% endif %}

    {% for part in paginate.parts %}
      {% if part.is_link %}
        <a href="{{ part.url }}">{{ part.title }}</a>
      {% else %}
        <span class="current">{{ part.title }}</span>
      {% endif %}
    {% endfor %}

    {% if paginate.next %}
      <a href="{{ paginate.next.url }}">Next →</a>
    {% endif %}
  </div>

{% endpaginate %}
```

### Variable Assignment

#### assign

Single-line variable assignment:

```liquid
{% assign sale_price = product.price | times: 0.8 %}
{% assign is_available = product.available %}
{% assign product_count = collection.products.size %}
{% assign full_name = customer.first_name | append: ' ' | append: customer.last_name %}
```

#### capture

Multi-line content capture:

```liquid
{% capture product_title %}
  {{ collection.title }} - {{ product.title }}
{% endcapture %}

{{ product_title }}  {# "Summer Sale - Blue T-Shirt" #}

{% capture greeting %}
  <h1>Welcome, {{ customer.name }}!</h1>
  <p>You have {{ customer.orders_count }} orders.</p>
{% endcapture %}

{{ greeting }}
```

#### liquid (multi-statement)

Cleaner syntax for multiple statements:

```liquid
{% liquid
  assign product_type = product.type
  assign is_on_sale = product.on_sale
  assign sale_percentage = product.discount_percent

  if is_on_sale
    assign status = 'SALE'
  else
    assign status = 'REGULAR'
  endif

  echo status
%}
```

### Template Inclusion

#### render

Isolated scope (preferred method):

```liquid
{# Basic usage #}
{% render 'product-card', product: product %}

{# Multiple parameters #}
{% render 'product-card',
  product: product,
  show_price: true,
  show_vendor: false,
  css_class: 'featured'
%}

{# Render for each item #}
{% render 'product-card' for collection.products as item %}

{# Pass arrays #}
{% render 'gallery', images: product.images %}
```

**Inside product-card.liquid:**

```liquid
{# Only has access to passed parameters #}
<div class="product {% if css_class %}{{ css_class }}{% endif %}">
  <h3>{{ product.title }}</h3>

  {% if show_price %}
    <p>{{ product.price | money }}</p>
  {% endif %}

  {% if show_vendor %}
    <p>{{ product.vendor }}</p>
  {% endif %}
</div>
```

#### include

Shared scope (legacy, avoid in new code):

```liquid
{% include 'product-details' %}

{# Can access all parent template variables #}
{# Harder to debug and reason about #}
```

#### section

Load dynamic sections:

```liquid
{% section 'featured-product' %}
{% section 'newsletter-signup' %}
```

### Utility Tags

#### comment

Multi-line comments:

```liquid
{% comment %}
  This entire block is ignored
  by the Liquid renderer.
  Use for documentation.
{% endcomment %}

{# Single-line comment #}
```

#### echo

Output shorthand (alternative to `{{ }}`):

```liquid
{% echo product.title %}
{# Equivalent to: {{ product.title }} #}
```

#### raw

Output Liquid code without processing:

```liquid
{% raw %}
  {{ This will be output as-is }}
  {% Liquid tags won't be processed %}
{% endraw %}
```

Useful for documentation or code examples.

## Whitespace Control

Strip whitespace using hyphens:

```liquid
{%- if condition -%}
  Content (whitespace stripped on both sides)
{%- endif -%}

{{ "hello" -}}world
{# Output: helloworld (no space) #}

{{- product.title }}
{# Strips whitespace before output #}

{{ product.title -}}
{# Strips whitespace after output #}
```

**Example:**

```liquid
{# Without whitespace control: #}
{% for item in array %}
  {{ item }}
{% endfor %}

{# Output has newlines and indentation #}

{# With whitespace control: #}
{%- for item in array -%}
  {{ item }}
{%- endfor -%}

{# Output is compact #}
```

## Operator Precedence

**Order of evaluation (right-to-left):**

```liquid
{% if true or false and false %}
  {# Evaluates as: true or (false and false) = true #}
{% endif %}
```

**IMPORTANT:** No parentheses support in Liquid. Break complex conditions into variables:

```liquid
{# ❌ DOESN'T WORK: #}
{% if (x > 5 and y < 10) or z == 0 %}

{# ✅ WORKS: #}
{% assign condition1 = false %}
{% if x > 5 and y < 10 %}
  {% assign condition1 = true %}
{% endif %}

{% if condition1 or z == 0 %}
  {# Logic here #}
{% endif %}
```

## Performance Tips

1. **Cache repeated calculations:**

```liquid
{# ❌ Inefficient: #}
{% for i in (1..10) %}
  {{ collection.products.size }}  {# Calculated 10 times #}
{% endfor %}

{# ✅ Efficient: #}
{% assign product_count = collection.products.size %}
{% for i in (1..10) %}
  {{ product_count }}
{% endfor %}
```

2. **Use `limit` and `offset` instead of iterating full arrays:**

```liquid
{# ❌ Inefficient: #}
{% for product in collection.products %}
  {% if forloop.index <= 5 %}
    {{ product.title }}
  {% endif %}
{% endfor %}

{# ✅ Efficient: #}
{% for product in collection.products limit: 5 %}
  {{ product.title }}
{% endfor %}
```

3. **Prefer `render` over `include`** for better performance and variable scoping

4. **Use `liquid` tag** for cleaner multi-statement blocks

## Common Gotchas

1. **No parentheses in conditions** - Use variables instead
2. **Right-to-left evaluation** - Be careful with operator precedence
3. **String concatenation** - Use `append` filter or `capture` tag
4. **Array/object mutation** - Not possible; create new variables
5. **Integer division** - `{{ 5 | divided_by: 2 }}` returns `2`, not `2.5`
6. **Truthy/falsy values:**
   - `false` and `nil` are falsy
   - Everything else (including `0`, `""`, `[]`) is truthy

## LiquidDoc

Document snippet parameters with structured comments (available since 2024):

### Basic usage

```liquid
{% doc %}
  @param {String} title - The product title to display
  @param {Number} price - Price in cents
  @param {Boolean} [show_vendor] - Whether to show vendor (optional)
  @example
    {% render 'product-card', title: product.title, price: product.price %}
{% enddoc %}

<div class="product-card">
  <h3>{{ title }}</h3>
  <p>{{ price | money }}</p>
  {% if show_vendor %}
    <span>{{ vendor }}</span>
  {% endif %}
</div>
```

### Supported types

- `{String}` - text values
- `{Number}` - numeric values
- `{Boolean}` - true/false
- `{Object}` - Shopify objects (product, collection, etc.)
- `{Array}` - arrays of values
- `{Image}` - image objects

### Optional parameters

Wrap parameter name in square brackets:

```liquid
{% doc %}
  @param {String} heading - Section heading
  @param {String} [subheading] - Optional subheading
  @param {Number} [limit=5] - Items to show (default: 5)
{% enddoc %}
```

### Benefits

- Theme editor shows parameter hints when editing `render` tags
- IDE extensions can provide autocomplete
- Self-documenting code for team collaboration
- Theme Check validates parameter usage

## Debugging Tips

1. **Output variable types:**

```liquid
{{ product | json }}  {# Output entire object as JSON #}
{{ product.class }}   {# Output object type #}
{{ variable.size }}   {# Check array/string length #}
```

2. **Check for nil/existence:**

```liquid
{% if product.metafield %}
  Metafield exists
{% else %}
  Metafield is nil
{% endif %}
```

3. **Use default filter for safety:**

```liquid
{{ product.metafield.value | default: "Not set" }}
```

4. **Enable theme preview console** to see Liquid errors in real-time
