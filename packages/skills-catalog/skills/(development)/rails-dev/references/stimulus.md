# Stimulus

Stimulus connects small bits of behavior to HTML that Turbo can't express on its own (copy-to-clipboard, toggles, autosubmit, keyboard shortcuts). Controllers are tiny, single-purpose, and named after the behavior, not the domain. Reach for Stimulus only after Turbo (see `turbo.md`). Read before writing JavaScript.

---

## The one rule

One controller, one job. A controller named for a behavior (`clipboard`, `auto-submit`, `dialog`) is reusable across the whole app; a controller named for a page or model (`card`, `dashboard`) becomes a junk drawer. If a controller grows past a screen or sprouts unrelated methods, split it. Keep business logic on the server, behavior here.

---

## Anatomy

A controller declares its `targets` (elements it reaches), `values` (typed data from the DOM), and action methods (event handlers), wired entirely through `data-` attributes. A usage comment at the top documents the markup.

```javascript
// app/javascript/controllers/clipboard_controller.js
import { Controller } from "@hotwired/stimulus"

// Copies a value to the clipboard and swaps the icon briefly.
//
//   <div data-controller="clipboard" data-clipboard-value-value="text to copy">
//     <button data-action="clipboard#copy">
//       <span data-clipboard-target="defaultIcon">📋</span>
//       <span data-clipboard-target="successIcon" class="hidden">✓</span>
//     </button>
//   </div>
export default class extends Controller {
  static values  = { value: String }
  static targets = ["defaultIcon", "successIcon"]

  copy() {
    navigator.clipboard.writeText(this.valueValue)
    this.showSuccess()
  }

  showSuccess() {
    this.defaultIconTarget.classList.add("hidden")
    this.successIconTarget.classList.remove("hidden")
    setTimeout(() => {
      this.successIconTarget.classList.add("hidden")
      this.defaultIconTarget.classList.remove("hidden")
    }, 1500)
  }
}
```

---

## Wiring (the data attributes)

| Attribute | Purpose |
|---|---|
| `data-controller="clipboard"` | attach the controller to this element |
| `data-action="click->clipboard#copy"` | call `copy()` on the event (event name optional for an element's default) |
| `data-clipboard-target="successIcon"` | expose the element as `this.successIconTarget` |
| `data-clipboard-value-value="…"` | set `this.valueValue`, typed by `static values` |

`static classes = ["active"]` + `data-clipboard-active-class="…"` lets the HTML own CSS class names instead of hard-coding them in JS.

---

## Reacting to values, and optional targets

Stimulus calls `<name>ValueChanged()` whenever a value changes (including on connect), which makes a controller react declaratively instead of wiring listeners. Guard optional elements with `has<Name>Target` / plural `<name>Targets`.

```javascript
import { Controller } from "@hotwired/stimulus"

// Hides the "assign" affordance once a limit is reached.
export default class extends Controller {
  static values  = { limit: Number, count: Number }
  static targets = ["unassigned", "limitMessage"]

  countValueChanged() {
    const atLimit = this.countValue >= this.limitValue

    this.unassignedTargets.forEach(el => { el.hidden = atLimit })

    if (this.hasLimitMessageTarget) {
      this.limitMessageTarget.hidden = !atLimit
    }
  }
}
```

---

## Lifecycle and cleanup

`connect()` runs when the controller attaches, `disconnect()` when it leaves. Turbo caches and restores pages, so anything global you set up (timers, document/window listeners, observers) **must** be torn down in `disconnect`, or it leaks across navigations.

```javascript
connect()    { this.timer = setTimeout(() => this.element.remove(), 5000) }
disconnect() { clearTimeout(this.timer) }
```

Use plain DOM APIs (`classList`, `hidden`, `addEventListener`, `navigator.*`). No jQuery, no framework.

---

## Testing

Stimulus behavior is exercised through system tests (Capybara drives a real browser), not JS unit tests, see `test.md`. Assert the user-visible effect:

```ruby
test "copying shows the success icon" do
  visit card_path(cards(:logo))
  click_button "Copy"
  assert_selector "[data-clipboard-target='successIcon']:not(.hidden)"
end
```

---

## Checklist

- One behavior per controller, named for the behavior (`clipboard`), never the domain (`card`)
- `targets`/`values`/`classes` declared statically; everything wired through `data-` attributes
- React with `<name>ValueChanged()`; guard optional elements with `has<Name>Target`
- A usage comment at the top showing the markup
- `disconnect()` tears down every timer, listener, and observer set up in `connect()`
- Plain DOM APIs; no jQuery or extra framework
- Turbo first; Stimulus only for behavior Turbo can't express; covered by a system test
