# Verify screens

A fresh sub-agent judges the screens a capture draws and nothing else. It runs beside the Verifier
whenever a criterion cites a capture, and writes the verdict the gate reads. A screen no capture
draws is not its business: a test or a `walk` proof settles it.

## What it receives

`plan.md`, this file, every capture, and the author's `<capture>.running.png` beside each. Not the
checks, the diff or the author's `## Handoff`: they carry the judgement of whoever built the screen.
Not the app's source either - markup, styles, scripts: you judge what the picture shows, and code
read beforehand explains a difference away instead of reporting it.

Do not start the app, walk it, or take another screenshot.

## Judge each picture

Judge that one state. A fact that lives in another state is not a gap in this picture. A click that
is not itself in the picture is not a gap when the resulting state is. A picture that cuts off the
state it shows fails until it is retaken, at the capture's size, with that state in view.

A picture taken in a wider window and resized to the capture's size looks like a match while the
page at that size is another layout. Its text gives it away: a label the capture also draws reads
smaller in the picture. That is a `render` row `differs - resized`, and the author retakes it.

Open the capture and the picture together. First write the capture's inventory: one row per thing
it draws - each region, control, label and sentence, chip, state mark, line, legend entry, and the
arrangement of each region. Then mark every row `same` or `differs`, applying what
`## Differences from the source` lists, and for `differs` say what the picture draws instead. The
builder fixes what the rows name and nothing else, so the inventory is the whole judgement: a thing
no row names is never checked.

What counts as `differs`:

- **controls** - a control the capture shows missing, or one it does not show
- **arrangement** - not the same regions in the same places, with the same nesting
- **copy** - visible text the capture fixes, wrong; a date that follows the day the picture was
  taken is not wrong
- **drawing** - an element drawn differently: a line, a border, a badge, the shape of a bar, the
  layout of a meter or a form
- **render** - overlapping, cut off, scrolled off the window, unreadable, or a component the rest
  of the app does not use

Exact spacing, shade and type weight are a note on a `same` row. A picture with one `differs` row
`diverges`; otherwise it `matches`.

## Report

Write `.specs/features/<feature>/screens.md`: the round, the commit you judged, the verdict table,
then one inventory per picture.

```markdown
# <Feature> screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 1
**HEAD**: <short sha of the commit the pictures were taken at>

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/billing--card-form.running.png` | `captures/billing--card-form.png` | diverges | 2 rows differ |

### `captures/billing--card-form.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| header: title `Billing`, close `×` on the right | same | |
| card form: number, expiry and CVC on one row | differs | expiry and CVC on a second row |
| `Update card` button, filled, under the form | differs | outlined button |
```

Return the rows that differ in chat; a diverging screen goes back to the builder with the
Verifier's findings.

## The second round

There is one more round after the fix pass, and it is the last. It runs whenever the fix changed
code, even when no row differed: the verdict holds only for the commit it names, and the gate fails
when code changed after it.

The builder re-saves every picture at the new `HEAD`, then resumes the round-1 screens sub-agent:
it holds the inventory. Where it cannot be resumed, a fresh one starts from `screens.md`. It reopens
the rows marked `differs` on the re-saved pictures and marks each `same` or `differs` again. A row
marked `same` that the new picture visibly breaks is marked `differs - regression`; nothing else is
added and nothing that passed is re-judged. It sets `**Round**: 2` and the new `**HEAD**`. There is no third round: what still
differs goes to the user.
