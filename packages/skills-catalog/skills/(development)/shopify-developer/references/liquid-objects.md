# Liquid Objects Reference

## Global Objects (Available Everywhere)

### shop

Store-level information:

```liquid
{{ shop.name }}              {# Store name #}
{{ shop.url }}               {# Store URL (https://...) #}
{{ shop.description }}       {# Store tagline/description #}
{{ shop.currency }}          {# ISO currency code: USD, GBP, EUR #}
{{ shop.money_format }}      {# Money format string: ${{amount}} #}
{{ shop.permanent_domain }}  {# Domain: store.myshopify.com #}
{{ shop.domain }}            {# Primary domain #}
{{ shop.email }}             {# Support email #}
{{ shop.phone }}             {# Support phone #}
{{ shop.address }}           {# Store address object #}
{{ shop.address.city }}
{{ shop.address.province }}
{{ shop.address.country }}
{{ shop.address.zip }}
{{ shop.enabled_payment_types }}  {# Array of enabled payment methods #}
{{ shop.checkout.privacy_policy_url }}
{{ shop.checkout.terms_of_service_url }}
{{ shop.checkout.refund_policy_url }}
```

### request

Request context and routing:

```liquid
{{ request.path }}                {# Current URL path: /products/handle #}
{{ request.host }}                {# Current domain #}
{{ request.origin }}              {# Protocol + host #}
{{ request.page_type }}           {# "product", "collection", "index", etc. #}
{{ request.locale.iso_code }}     {# Language: "en", "fr", "es" #}
{{ request.locale.root_url }}     {# Root URL for locale #}
{{ request.design_mode }}         {# Boolean: theme editor active #}
{{ request.visual_preview_mode }} {# Boolean: theme preview active #}

{# Query parameters #}
{{ request.query_string }}        {# Full query string #}

{# Build canonical URL #}
{{ request.canonical_url }}       {# Full canonical URL #}
{{ request.path_with_query }}     {# Path + query string #}
```

### settings

Theme settings (from settings_schema.json):

```liquid
{# Colours #}
{{ settings.color_primary }}
{{ settings.color_secondary }}
{{ settings.color_body_bg }}

{# Typography #}
{{ settings.type_header_font }}
{{ settings.type_body_font }}

{# Layout #}
{{ settings.layout_container_width }}
{{ settings.layout_sidebar_enabled }}

{# Media #}
{{ settings.logo }}              {# Image object #}
{{ settings.logo.src }}
{{ settings.logo.width }}
{{ settings.logo.height }}
{{ settings.logo.alt }}

{# Text content #}
{{ settings.announcement_text }}
{{ settings.footer_text }}

{# Boolean settings #}
{% if settings.show_breadcrumbs %}
  {# Render breadcrumbs #}
{% endif %}

{# URL settings #}
{{ settings.social_twitter_link }}
{{ settings.social_facebook_link }}
```

### routes

URL routes to standard pages:

```liquid
{{ routes.root_url }}               {# / #}
{{ routes.account_url }}            {# /account #}
{{ routes.account_login_url }}      {# /account/login #}
{{ routes.account_logout_url }}     {# /account/logout #}
{{ routes.account_register_url }}   {# /account/register #}
{{ routes.account_addresses_url }}  {# /account/addresses #}
{{ routes.collections_url }}        {# /collections #}
{{ routes.all_products_collection_url }}  {# /collections/all #}
{{ routes.search_url }}             {# /search #}
{{ routes.cart_url }}               {# /cart #}
{{ routes.cart_add_url }}           {# /cart/add #}
{{ routes.cart_change_url }}        {# /cart/change #}
{{ routes.cart_clear_url }}         {# /cart/clear #}
{{ routes.cart_update_url }}        {# /cart/update #}
```

### section

Current section context (within sections):

```liquid
{{ section.id }}                  {# Unique ID: "section-1234567890" #}
{{ section.settings.title }}      {# Section setting #}
{{ section.settings.background_color }}
{{ section.index }}               {# Position on page #}
{{ section.location }}            {# Where section appears #}

{# Blocks #}
{{ section.blocks }}              {# Array of blocks #}
{{ section.blocks.size }}         {# Number of blocks #}

{% for block in section.blocks %}
  {{ block.id }}
  {{ block.type }}
  {{ block.settings.text }}
  {{ block.shopify_attributes }}  {# Required for theme editor #}
{% endfor %}

{# Blocks by type #}
{{ section.blocks_by_type }}      {# Organised by type #}
```

### block

Current block context (within section blocks):

```liquid
{{ block.id }}                    {# Unique ID: "block-9876543210" #}
{{ block.type }}                  {# Block type name #}
{{ block.settings.text }}         {# Block setting #}
{{ block.shopify_attributes }}    {# Required for theme editor #}

{# Example usage in section #}
{% for block in section.blocks %}
  <div {{ block.shopify_attributes }}>
    {% case block.type %}
      {% when 'heading' %}
        <h2>{{ block.settings.title }}</h2>
      {% when 'text' %}
        <p>{{ block.settings.content }}</p>
    {% endcase %}
  </div>
{% endfor %}
```

## Page Context Objects

### product

Product object (on product pages):

```liquid
{# Core properties #}
{{ product.id }}                   {# Numeric ID #}
{{ product.title }}                {# Product name #}
{{ product.handle }}               {# URL slug #}
{{ product.description }}          {# Full HTML description #}
{{ product.vendor }}               {# Brand/manufacturer #}
{{ product.type }}                 {# Category #}
{{ product.url }}                  {# Product URL #}
{{ product.available }}            {# Boolean: any variant in stock #}
{{ product.published_at }}         {# Publication timestamp #}
{{ product.created_at }}           {# Creation timestamp #}
{{ product.updated_at }}           {# Last modified timestamp #}

{# Pricing (in cents) #}
{{ product.price }}                {# Current variant price #}
{{ product.price_min }}            {# Cheapest variant #}
{{ product.price_max }}            {# Most expensive variant #}
{{ product.price_varies }}         {# Boolean: different prices #}
{{ product.compare_at_price }}     {# Original price for sales #}
{{ product.compare_at_price_min }}
{{ product.compare_at_price_max }}
{{ product.compare_at_price_varies }}

{# Images #}
{{ product.featured_image }}       {# Primary image object #}
{{ product.featured_image.src }}
{{ product.featured_image.width }}
{{ product.featured_image.height }}
{{ product.featured_image.alt }}
{{ product.featured_image | img_url: '500x500' }}

{{ product.images }}               {# Array of all images #}
{{ product.images.size }}          {# Image count #}

{% for image in product.images %}
  <img src="{{ image | img_url: '300x300' }}" alt="{{ image.alt }}">
{% endfor %}

{{ product.media }}                {# Array of all media (images, videos, 3D) #}

{# Variants #}
{{ product.variants }}             {# Array of variants #}
{{ product.variants.size }}        {# Variant count #}
{{ product.selected_variant }}     {# Currently selected variant #}
{{ product.selected_or_first_available_variant }}
{{ product.first_available_variant }}
{{ product.has_only_default_variant }}  {# Boolean: single variant #}

{# Options #}
{{ product.options }}              {# Array: ["Size", "Color"] #}
{{ product.options_with_values }}  {# Array of option objects #}

{% for option in product.options_with_values %}
  <label>{{ option.name }}</label>
  <select>
    {% for value in option.values %}
      <option>{{ value }}</option>
    {% endfor %}
  </select>
{% endfor %}

{# Collections #}
{{ product.collections }}          {# Array of collections #}
{{ product.collections.size }}

{# Tags #}
{{ product.tags }}                 {# Array of tags #}
{{ product.tags | join: ", " }}

{# Custom data #}
{{ product.metafields.namespace.key }}
{{ product.metafields.custom.field_name }}

{# Template #}
{{ product.template_suffix }}      {# Template variant: "alternate" #}
```

### variant

Variant object (product.variants, product.selected_variant):

```liquid
{{ variant.id }}                   {# Variant ID #}
{{ variant.product_id }}           {# Parent product ID #}
{{ variant.title }}                {# "Red / Medium" #}
{{ variant.price }}                {# Price in cents #}
{{ variant.compare_at_price }}     {# Original price #}
{{ variant.sku }}                  {# SKU code #}
{{ variant.barcode }}              {# Barcode #}
{{ variant.weight }}               {# Weight in grams #}
{{ variant.weight_unit }}          {# "kg", "lb", etc. #}
{{ variant.weight_in_unit }}       {# Weight in configured unit #}

{# Availability #}
{{ variant.available }}            {# Boolean: in stock #}
{{ variant.inventory_quantity }}   {# Current stock level #}
{{ variant.inventory_policy }}     {# "continue" or "deny" #}
{{ variant.inventory_management }} {# "shopify" or null #}

{# Options #}
{{ variant.option1 }}              {# First option value: "Red" #}
{{ variant.option2 }}              {# Second option value: "Medium" #}
{{ variant.option3 }}              {# Third option value #}
{{ variant.options }}              {# Array: ["Red", "Medium"] #}

{# Image #}
{{ variant.featured_image }}       {# Variant-specific image #}
{{ variant.image }}                {# Same as featured_image #}

{# URL #}
{{ variant.url }}                  {# Product URL with variant param #}

{# Metafields #}
{{ variant.metafields.namespace.key }}
```

### collection

Collection object (on collection pages):

```liquid
{# Core properties #}
{{ collection.id }}                {# Numeric ID #}
{{ collection.title }}             {# Collection name #}
{{ collection.handle }}            {# URL slug #}
{{ collection.description }}       {# HTML description #}
{{ collection.url }}               {# Collection URL #}
{{ collection.published_at }}      {# Publication date #}

{# Image #}
{{ collection.image }}             {# Featured image object #}
{{ collection.image.src }}
{{ collection.image | img_url: '1024x1024' }}

{# Products #}
{{ collection.products }}          {# Array of products #}
{{ collection.products_count }}    {# Current page count #}
{{ collection.all_products_count }}{# Total count #}

{# Filtering & sorting #}
{{ collection.all_tags }}          {# All tags (max 1000) #}
{{ collection.all_types }}         {# All product types #}
{{ collection.all_vendors }}       {# All vendors #}
{{ collection.current_type }}      {# Active type filter #}
{{ collection.current_vendor }}    {# Active vendor filter #}
{{ collection.sort_by }}           {# Current sort method #}
{{ collection.default_sort_by }}   {# Default sort #}
{{ collection.sort_options }}      {# Available sort methods #}

{# Filters (Storefront Filtering) #}
{{ collection.filters }}           {# Array of filter objects #}

{% for filter in collection.filters %}
  {{ filter.label }}               {# Filter name #}
  {{ filter.type }}                {# "list", "price_range" #}
  {{ filter.active_values }}       {# Currently active #}
  {{ filter.values }}              {# Available values #}
{% endfor %}

{# Navigation (on product pages within collection) #}
{{ collection.next_product }}      {# Next product in collection #}
{{ collection.previous_product }}  {# Previous product #}

{# Metafields #}
{{ collection.metafields.namespace.key }}

{# Template #}
{{ collection.template_suffix }}
```

### cart

Cart object (global - always available):

```liquid
{# Cart state #}
{{ cart.item_count }}              {# Total line items #}
{{ cart.total_price }}             {# Total in cents #}
{{ cart.total_weight }}            {# Weight sum #}
{{ cart.empty? }}                  {# Boolean: is cart empty #}

{# Items #}
{{ cart.items }}                   {# Array of line items #}
{{ cart.items.size }}              {# Number of line items #}

{% for item in cart.items %}
  {{ item.product_id }}
  {{ item.variant_id }}
  {{ item.title }}
  {{ item.quantity }}
  {{ item.price }}
  {{ item.line_price }}            {# price × quantity #}
  {{ item.image }}
{% endfor %}

{# Notes and attributes #}
{{ cart.note }}                    {# Customer note #}
{{ cart.attributes }}              {# Custom cart attributes #}

{# Access specific attribute #}
{% if cart.attributes.gift_wrap %}
  Gift wrap requested
{% endif %}

{# Discounts #}
{{ cart.cart_level_discount_applications }}
{{ cart.total_discount }}          {# Total discount amount #}

{# Checkout #}
{{ cart.requires_shipping }}       {# Boolean #}
```

### line_item

Line item object (cart.items):

```liquid
{% for item in cart.items %}
  {{ item.id }}                    {# Line item ID #}
  {{ item.key }}                   {# Unique key #}
  {{ item.product_id }}            {# Product ID #}
  {{ item.variant_id }}            {# Variant ID #}

  {# Product info #}
  {{ item.product }}               {# Product object #}
  {{ item.variant }}               {# Variant object #}
  {{ item.title }}                 {# Product title #}
  {{ item.product_title }}         {# Same as title #}
  {{ item.variant_title }}         {# Variant options #}

  {# Pricing #}
  {{ item.quantity }}              {# Quantity ordered #}
  {{ item.price }}                 {# Price per unit (cents) #}
  {{ item.line_price }}            {# Total: price × quantity #}
  {{ item.original_price }}        {# Before discounts #}
  {{ item.original_line_price }}
  {{ item.final_price }}           {# After discounts #}
  {{ item.final_line_price }}

  {# Images #}
  {{ item.image }}                 {# Line item image #}
  {{ item.featured_image.src }}

  {# URL #}
  {{ item.url }}                   {# Link to product #}

  {# SKU #}
  {{ item.sku }}                   {# Variant SKU #}

  {# Properties (custom line item data) #}
  {{ item.properties }}            {# Hash of properties #}
  {% for property in item.properties %}
    {{ property.first }}: {{ property.last }}
  {% endfor %}

  {# Discounts #}
  {{ item.discount_allocations }}
  {% for discount in item.discount_allocations %}
    {{ discount.amount }}
    {{ discount.discount_application.title }}
  {% endfor %}

  {# Fulfilment #}
  {{ item.requires_shipping }}     {# Boolean #}
  {{ item.taxable }}               {# Boolean #}
{% endfor %}
```

### customer

Customer object (when logged in):

```liquid
{% if customer %}
  {{ customer.id }}                    {# Numeric ID #}
  {{ customer.email }}                 {# Email address #}
  {{ customer.first_name }}
  {{ customer.last_name }}
  {{ customer.name }}                  {# Full name #}
  {{ customer.phone }}

  {# Account status #}
  {{ customer.has_account }}           {# Boolean: registered #}
  {{ customer.accepts_marketing }}     {# Email marketing opt-in #}
  {{ customer.email_marketing_consent }}

  {# Addresses #}
  {{ customer.addresses }}             {# Array of addresses #}
  {{ customer.addresses_count }}
  {{ customer.default_address }}       {# Primary address #}

  {% for address in customer.addresses %}
    {{ address.first_name }}
    {{ address.last_name }}
    {{ address.address1 }}
    {{ address.address2 }}
    {{ address.city }}
    {{ address.province }}
    {{ address.province_code }}        {# State/region code #}
    {{ address.country }}
    {{ address.country_code }}         {# Country code: US, CA, etc. #}
    {{ address.zip }}
    {{ address.phone }}
    {{ address.company }}
  {% endfor %}

  {# Orders #}
  {{ customer.orders }}                {# Array of orders #}
  {{ customer.orders_count }}          {# Total orders #}
  {{ customer.total_spent }}           {# Lifetime value (cents) #}

  {# Tags #}
  {{ customer.tags }}                  {# Array of customer tags #}

  {# Metafields #}
  {{ customer.metafields.namespace.key }}
{% endif %}
```

### order

Order object (order confirmation, customer account):

```liquid
{{ order.id }}                     {# Numeric ID #}
{{ order.name }}                   {# Order name: "#1001" #}
{{ order.order_number }}           {# 1001 #}
{{ order.confirmation_number }}    {# Unique confirmation #}
{{ order.email }}                  {# Customer email #}
{{ order.phone }}                  {# Customer phone #}
{{ order.customer_url }}           {# Link to view order #}

{# Timestamps #}
{{ order.created_at }}             {# Order date/time #}
{{ order.updated_at }}
{{ order.cancelled_at }}           {# If cancelled #}
{{ order.processed_at }}

{# Customer #}
{{ order.customer }}               {# Customer object #}
{{ order.customer.name }}

{# Items #}
{{ order.line_items }}             {# Array of line items #}
{{ order.line_items_count }}

{% for item in order.line_items %}
  {{ item.title }}
  {{ item.quantity }}
  {{ item.price }}
  {{ item.line_price }}
{% endfor %}

{# Pricing #}
{{ order.subtotal_price }}         {# Before tax/shipping #}
{{ order.total_price }}            {# Grand total #}
{{ order.tax_price }}              {# Total tax #}
{{ order.shipping_price }}         {# Shipping cost #}
{{ order.total_discounts }}        {# Discount amount #}

{# Status #}
{{ order.financial_status }}       {# "paid", "pending", "refunded" #}
{{ order.fulfilment_status }}      {# "fulfilled", "partial", null #}
{{ order.cancelled }}              {# Boolean #}
{{ order.cancel_reason }}

{# Addresses #}
{{ order.shipping_address }}
{{ order.billing_address }}

{# Shipping #}
{{ order.shipping_method.title }}  {# Shipping method name #}
{{ order.shipping_method.price }}

{# Discounts #}
{{ order.discount_applications }}
{% for discount in order.discount_applications %}
  {{ discount.title }}
  {{ discount.total_allocated_amount }}
{% endfor %}

{# Notes #}
{{ order.note }}                   {# Customer note #}
{{ order.attributes }}             {# Custom attributes #}

{# Tags #}
{{ order.tags }}
```

### article

Article object (blog post pages):

```liquid
{{ article.id }}                   {# Numeric ID #}
{{ article.title }}                {# Article headline #}
{{ article.handle }}               {# URL slug #}
{{ article.content }}              {# Full HTML content #}
{{ article.excerpt }}              {# Summary/teaser #}
{{ article.excerpt_or_content }}   {# Excerpt if set, else content #}

{# Author #}
{{ article.author }}               {# Author name #}
{{ article.author_url }}           {# Author profile URL #}

{# Dates #}
{{ article.published_at }}         {# Publication date #}
{{ article.created_at }}
{{ article.updated_at }}

{# URL #}
{{ article.url }}                  {# Article URL #}

{# Image #}
{{ article.image }}                {# Featured image #}
{{ article.image.src }}
{{ article.image | img_url: 'large' }}

{# Comments #}
{{ article.comments }}             {# Array of comments #}
{{ article.comments_count }}
{{ article.comments_enabled }}     {# Boolean #}
{{ article.moderated }}            {# Comment moderation enabled #}

{# Tags #}
{{ article.tags }}                 {# Array of tags #}

{# Blog reference #}
{{ article.blog }}                 {# Parent blog object #}
{{ article.blog.title }}

{# Metafields #}
{{ article.metafields.namespace.key }}
```

### blog

Blog object (blog listing page):

```liquid
{{ blog.id }}                      {# Numeric ID #}
{{ blog.title }}                   {# Blog name #}
{{ blog.handle }}                  {# URL slug #}
{{ blog.url }}                     {# Blog URL #}

{# Articles #}
{{ blog.articles }}                {# Array of articles #}
{{ blog.articles_count }}          {# Total articles #}

{# Tags #}
{{ blog.all_tags }}                {# All article tags #}

{# Metafields #}
{{ blog.metafields.namespace.key }}
```

### search

Search results object:

```liquid
{{ search.performed }}             {# Boolean: search executed #}
{{ search.results }}               {# Results array #}
{{ search.results_count }}         {# Number of results #}
{{ search.terms }}                 {# Search query #}
{{ search.types }}                 {# Resource types found #}

{% for item in search.results %}
  {% case item.object_type %}
    {% when 'product' %}
      {{ item.title }}
      {{ item.price | money }}
    {% when 'article' %}
      {{ item.title }}
      {{ item.excerpt }}
    {% when 'page' %}
      {{ item.title }}
      {{ item.content | strip_html | truncatewords: 50 }}
  {% endcase %}
{% endfor %}
```

## Metafields

Access custom data on any object:

```liquid
{# Product metafields #}
{{ product.metafields.namespace.key }}
{{ product.metafields.custom.warranty_info }}
{{ product.metafields.specifications.material }}

{# Collection metafields #}
{{ collection.metafields.seo.custom_title }}

{# Customer metafields #}
{{ customer.metafields.loyalty.points }}

{# Shop metafields #}
{{ shop.metafields.global.announcement }}

{# Check for existence #}
{% if product.metafields.custom.size_guide %}
  {{ product.metafields.custom.size_guide }}
{% endif %}

{# Use default filter for safety #}
{{ product.metafields.custom.field | default: "Not specified" }}
```

## Metaobjects

Access metaobject definitions:

```liquid
{# Access metaobject by handle #}
{% assign testimonial = shop.metaobjects.testimonials['customer-review-1'] %}

{{ testimonial.name }}
{{ testimonial.rating }}
{{ testimonial.content }}

{# Loop through metaobjects #}
{% for testimonial in shop.metaobjects.testimonials.values %}
  {{ testimonial.fields.author }}
  {{ testimonial.fields.quote }}
{% endfor %}
```
