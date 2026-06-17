# Liquid Filters Reference

Filters modify output using pipe syntax: `{{ value | filter: parameter }}`

## String Filters

### upcase

Convert to uppercase:

```liquid
{{ "hello world" | upcase }}
{# Output: HELLO WORLD #}
```

### downcase

Convert to lowercase:

```liquid
{{ "HELLO WORLD" | downcase }}
{# Output: hello world #}
```

### capitalize

Capitalize first letter only:

```liquid
{{ "hello world" | capitalize }}
{# Output: Hello world #}
```

### reverse

Reverse string or array:

```liquid
{{ "hello" | reverse }}
{# Output: olleh #}

{{ array | reverse }}
{# Reverses array order #}
```

### size

Get character count or array length:

```liquid
{{ "hello" | size }}
{# Output: 5 #}

{{ collection.products | size }}
{# Output: number of products #}
```

### remove

Remove all occurrences of substring:

```liquid
{{ "hello world world" | remove: "world" }}
{# Output: hello   #}
```

### remove_first

Remove first occurrence only:

```liquid
{{ "hello world world" | remove_first: "world" }}
{# Output: hello  world #}
```

### replace

Replace all occurrences:

```liquid
{{ "hello" | replace: "l", "L" }}
{# Output: heLLo #}
```

### replace_first

Replace first occurrence only:

```liquid
{{ "hello" | replace_first: "l", "L" }}
{# Output: heLlo #}
```

### split

Split string into array:

```liquid
{{ "a,b,c,d" | split: "," }}
{# Output: ["a", "b", "c", "d"] #}

{% assign tags = "sale,new,featured" | split: "," %}
{% for tag in tags %}
  {{ tag }}
{% endfor %}
```

### strip

Remove leading and trailing whitespace:

```liquid
{{ "  hello  " | strip }}
{# Output: hello #}
```

### lstrip

Remove leading whitespace only:

```liquid
{{ "  hello  " | lstrip }}
{# Output: hello   #}
```

### rstrip

Remove trailing whitespace only:

```liquid
{{ "  hello  " | rstrip }}
{# Output:   hello #}
```

### truncate

Limit string length with ellipsis:

```liquid
{{ "hello world" | truncate: 8 }}
{# Output: hello... #}

{{ "hello world" | truncate: 10, "!" }}
{# Output: hello worl! #}

{{ "hello world" | truncate: 50 }}
{# Output: hello world (no truncation if shorter) #}
```

### truncatewords

Limit by word count:

```liquid
{{ "hello world testing" | truncatewords: 2 }}
{# Output: hello world... #}

{{ "hello world testing" | truncatewords: 2, "--" }}
{# Output: hello world-- #}
```

### append

Add string to end:

```liquid
{{ "hello" | append: " world" }}
{# Output: hello world #}

{% assign file_name = "image" | append: ".jpg" %}
{# file_name: image.jpg #}
```

### prepend

Add string to beginning:

```liquid
{{ "world" | prepend: "hello " }}
{# Output: hello world #}
```

### newline_to_br

Convert newlines to `<br>` tags:

```liquid
{{ product.description | newline_to_br }}
{# Converts \n to <br> #}
```

### strip_html

Remove all HTML tags:

```liquid
{{ "<p>Hello <strong>world</strong></p>" | strip_html }}
{# Output: Hello world #}
```

### escape

Escape HTML special characters:

```liquid
{{ "<div>Test</div>" | escape }}
{# Output: &lt;div&gt;Test&lt;/div&gt; #}
```

### escape_once

Escape HTML but don't double-escape:

```liquid
{{ "&lt;div&gt;" | escape_once }}
{# Output: &lt;div&gt; (not double-escaped) #}
```

### url_encode

URL-encode string:

```liquid
{{ "hello world" | url_encode }}
{# Output: hello+world #}

{{ "foo@bar.com" | url_encode }}
{# Output: foo%40bar.com #}
```

### url_decode

Decode URL-encoded string:

```liquid
{{ "hello+world" | url_decode }}
{# Output: hello world #}
```

### base64_encode

Encode to base64:

```liquid
{{ "hello" | base64_encode }}
{# Output: aGVsbG8= #}
```

### base64_decode

Decode from base64:

```liquid
{{ "aGVsbG8=" | base64_decode }}
{# Output: hello #}
```

### slice

Extract substring or array slice:

```liquid
{{ "hello" | slice: 0, 3 }}
{# Output: hel #}

{{ "hello" | slice: -3, 3 }}
{# Output: llo #}
```

## Numeric Filters

### abs

Absolute value:

```liquid
{{ -5 | abs }}
{# Output: 5 #}

{{ 5 | abs }}
{# Output: 5 #}
```

### ceil

Round up to nearest integer:

```liquid
{{ 1.2 | ceil }}
{# Output: 2 #}

{{ 1.9 | ceil }}
{# Output: 2 #}
```

### floor

Round down to nearest integer:

```liquid
{{ 1.9 | floor }}
{# Output: 1 #}

{{ 1.1 | floor }}
{# Output: 1 #}
```

### round

Round to specified decimal places:

```liquid
{{ 1.5 | round }}
{# Output: 2 #}

{{ 1.567 | round: 2 }}
{# Output: 1.57 #}

{{ 1.234 | round: 1 }}
{# Output: 1.2 #}
```

### plus

Addition:

```liquid
{{ 5 | plus: 3 }}
{# Output: 8 #}

{{ product.price | plus: 1000 }}
{# Add $10.00 (prices in cents) #}
```

### minus

Subtraction:

```liquid
{{ 5 | minus: 3 }}
{# Output: 2 #}
```

### times

Multiplication:

```liquid
{{ 5 | times: 3 }}
{# Output: 15 #}

{{ product.price | times: 0.8 }}
{# 20% discount #}
```

### divided_by

Integer division:

```liquid
{{ 10 | divided_by: 2 }}
{# Output: 5 #}

{{ 10 | divided_by: 3 }}
{# Output: 3 (integer division) #}

{{ 10.0 | divided_by: 3 }}
{# Output: 3.33... (float division) #}
```

### modulo

Get remainder:

```liquid
{{ 10 | modulo: 3 }}
{# Output: 1 #}

{# Check if even #}
{% if forloop.index | modulo: 2 == 0 %}
  Even row
{% endif %}
```

### at_least

Ensure minimum value:

```liquid
{{ 1 | at_least: 5 }}
{# Output: 5 #}

{{ 10 | at_least: 5 }}
{# Output: 10 #}
```

### at_most

Ensure maximum value:

```liquid
{{ 100 | at_most: 50 }}
{# Output: 50 #}

{{ 10 | at_most: 50 }}
{# Output: 10 #}
```

## Array/Collection Filters

### first

Get first element:

```liquid
{{ collection.products | first }}
{# Returns first product #}

{{ "a,b,c" | split: "," | first }}
{# Output: a #}
```

### last

Get last element:

```liquid
{{ collection.products | last }}
{# Returns last product #}
```

### join

Join array with separator:

```liquid
{{ product.tags | join: ", " }}
{# Output: sale, new, featured #}
```

### map

Extract property from each object:

```liquid
{{ collection.products | map: "title" }}
{# Returns array of product titles #}

{{ collection.products | map: "title" | join: ", " }}
{# Output: Product 1, Product 2, Product 3 #}
```

### sort

Sort array by property:

```liquid
{{ collection.products | sort: "price" }}
{# Sort by price ascending #}

{{ collection.products | sort: "title" }}
{# Sort alphabetically #}
```

### sort_natural

Case-insensitive sort:

```liquid
{{ collection.products | sort_natural: "title" }}
{# Sorts: Apple, banana, Cherry (natural order) #}
```

### where

Filter array by property value:

```liquid
{{ collection.products | where: "vendor", "Nike" }}
{# Only Nike products #}

{{ collection.products | where: "available", true }}
{# Only available products #}

{{ collection.products | where: "type", "shoes" | map: "title" }}
{# Combine with map #}
```

### uniq

Remove duplicates:

```liquid
{{ collection.all_vendors | uniq }}
{# Unique vendor names #}
```

### limit

Limit array to N items:

```liquid
{{ collection.products | limit: 5 }}
{# First 5 products #}
```

### offset

Skip first N items:

```liquid
{{ collection.products | offset: 10 }}
{# Products from 11th onward #}
```

### concat

Merge two arrays:

```liquid
{% assign array1 = "a,b,c" | split: "," %}
{% assign array2 = "d,e,f" | split: "," %}
{{ array1 | concat: array2 | join: ", " }}
{# Output: a, b, c, d, e, f #}
```

### compact

Remove nil values from array:

```liquid
{{ array | compact }}
{# Removes nil/null elements #}
```

## Shopify-Specific Filters

### money

Format as currency with symbol:

```liquid
{{ 1000 | money }}
{# Output: $10.00 #}

{{ 1599 | money }}
{# Output: $15.99 #}
```

### money_without_currency

Format without currency symbol:

```liquid
{{ 1000 | money_without_currency }}
{# Output: 10.00 #}
```

### money_without_trailing_zeros

Remove unnecessary decimals:

```liquid
{{ 1000 | money_without_trailing_zeros }}
{# Output: $10 #}

{{ 1050 | money_without_trailing_zeros }}
{# Output: $10.50 #}
```

### weight_with_unit

Add weight unit:

```liquid
{{ 500 | weight_with_unit }}
{# Output: 500 g #}

{{ product.variants.first.weight | weight_with_unit }}
```

### asset_url

Get theme asset CDN URL:

```liquid
{{ 'logo.png' | asset_url }}
{# Output: //cdn.shopify.com/s/files/1/0000/0000/t/1/assets/logo.png #}
```

### img_url

Generate image URL with size:

```liquid
{{ product.featured_image | img_url: '500x500' }}
{# Resize to 500x500 #}

{{ product.featured_image | img_url: 'large' }}
{# Named size: pico, icon, thumb, small, compact, medium, large, grande, 1024x1024, 2048x2048 #}

{{ product.featured_image | img_url: '500x500', crop: 'center' }}
{# With crop #}
```

### link_to_type

Create link to product type collection:

```liquid
{{ product.type | link_to_type }}
{# Output: <a href="/collections/types?q=Shoes">Shoes</a> #}
```

### link_to_vendor

Create link to vendor collection:

```liquid
{{ product.vendor | link_to_vendor }}
{# Output: <a href="/collections/vendors?q=Nike">Nike</a> #}
```

### link_to_tag

Create link to tag filter:

```liquid
{{ tag | link_to_tag: tag }}
{# Output: <a href="/collections/all/sale">sale</a> #}
```

### highlight

Highlight search terms:

```liquid
{{ product.title | highlight: search.terms }}
{# Wraps search terms in <strong class="highlight"> tags #}
```

### highlight_active_tag

Highlight current tag:

```liquid
{{ tag | highlight_active_tag: tag }}
{# Wraps current tag in <span class="active"> #}
```

### payment_type_img_url

Get payment icon URL:

```liquid
{{ 'visa' | payment_type_img_url }}
{# Returns Shopify-hosted Visa icon URL #}
```

### placeholder_svg_tag

Generate placeholder SVG:

```liquid
{{ 'product-1' | placeholder_svg_tag }}
{# Generates placeholder product image SVG #}

{{ 'collection-1' | placeholder_svg_tag: 'custom-class' }}
{# With custom CSS class #}
```

### color_to_rgb

Convert hex to RGB:

```liquid
{{ '#ff0000' | color_to_rgb }}
{# Output: rgb(255, 0, 0) #}
```

### color_to_hsl

Convert hex to HSL:

```liquid
{{ '#ff0000' | color_to_hsl }}
{# Output: hsl(0, 100%, 50%) #}
```

### color_extract

Extract colour component:

```liquid
{{ '#ff0000' | color_extract: 'red' }}
{# Output: 255 #}
```

### color_brightness

Calculate brightness:

```liquid
{{ '#ff0000' | color_brightness }}
{# Output: brightness value 0-255 #}
```

### color_modify

Modify colour properties:

```liquid
{{ '#ff0000' | color_modify: 'alpha', 0.5 }}
{# Adjust alpha channel #}
```

## Date Filters

### date

Format date using strftime:

```liquid
{{ order.created_at | date: '%B %d, %Y' }}
{# Output: November 10, 2026 #}

{{ order.created_at | date: '%m/%d/%Y' }}
{# Output: 11/10/2026 #}

{{ order.created_at | date: '%Y-%m-%d %H:%M:%S' }}
{# Output: 2026-11-10 14:30:00 #}
```

**Common format codes:**

- `%Y` - 4-digit year (2026)
- `%y` - 2-digit year (26)
- `%m` - Month number (11)
- `%B` - Full month (November)
- `%b` - Short month (Nov)
- `%d` - Day of month (10)
- `%e` - Day without leading zero (10)
- `%A` - Full weekday (Monday)
- `%a` - Short weekday (Mon)
- `%H` - Hour 24-hour (14)
- `%I` - Hour 12-hour (02)
- `%M` - Minutes (30)
- `%S` - Seconds (45)
- `%p` - AM/PM
- `%z` - Timezone offset (+0000)

**Examples:**

```liquid
{{ "now" | date: "%Y-%m-%d" }}
{# Current date: 2026-11-10 #}

{{ article.published_at | date: "%B %d, %Y at %I:%M %p" }}
{# November 10, 2026 at 02:30 PM #}
```

## URL Filters

### url_for_type

Get collection URL for product type:

```liquid
{{ product.type | url_for_type }}
{# Output: /collections/types?q=Shoes #}
```

### url_for_vendor

Get collection URL for vendor:

```liquid
{{ product.vendor | url_for_vendor }}
{# Output: /collections/vendors?q=Nike #}
```

### within

Scope URL within collection:

```liquid
{{ product.url | within: collection }}
{# Output: /collections/sale/products/product-handle #}
```

### default_pagination

Generate pagination HTML:

```liquid
{{ paginate | default_pagination }}
{# Outputs complete pagination HTML #}
```

## Utility Filters

### default

Provide fallback value:

```liquid
{{ product.metafield | default: "N/A" }}
{# If metafield is nil, outputs "N/A" #}

{{ variant.title | default: "Default" }}
```

### json

Convert to JSON:

```liquid
{{ product | json }}
{# Outputs product object as JSON string #}

<script>
var productData = {{ product | json }};
</script>
```

## Filter Chaining

Filters execute left-to-right and can be chained:

```liquid
{{ "hello world" | upcase | replace: "WORLD", "SHOPIFY" }}
{# Output: HELLO SHOPIFY #}

{{ collection.products | where: "available" | map: "title" | sort | join: ", " }}
{# Filter → extract → sort → join #}

{{ product.price | times: 0.8 | round: 2 | money }}
{# Calculate 20% discount, round, format as money #}

{{ product.description | strip_html | truncatewords: 50 | escape }}
{# Strip HTML → truncate → escape for safety #}
```

## Performance Tips

1. **Cache filtered results** if used multiple times:

```liquid
{# ❌ Inefficient: #}
{% for i in (1..10) %}
  {{ collection.products | where: "available" | size }}
{% endfor %}

{# ✅ Efficient: #}
{% assign available_products = collection.products | where: "available" %}
{% for i in (1..10) %}
  {{ available_products.size }}
{% endfor %}
```

2. **Use `limit` and `offset` filters** instead of manual iteration control

3. **Combine filters intelligently** to reduce operations:

```liquid
{# ❌ Less efficient: #}
{% assign titles = collection.products | map: "title" %}
{% assign sorted = titles | sort %}
{% assign limited = sorted | limit: 5 %}

{# ✅ More efficient: #}
{% assign limited_titles = collection.products | map: "title" | sort | limit: 5 %}
```
