# Verify screens

A fresh sub-agent judges the screens a capture draws and nothing else. It runs beside the Verifier
whenever a criterion cites a capture, and writes the verdict the gate reads.

## What it receives

`spec.md`, this file, the captures, and the `**Walked:**` line from tasks.md `## Handoff`, which says
how the user reaches each state. Not the checks, the diff or the rest of the Handoff: they carry the
judgement of whoever built the screen.

## Take the pictures yourself

The author's picture is the author's claim, and a picture taken in a wider window and resized to the
capture's size passes as a match while the page at that size is a different layout. So open the
running app in a browser window at each capture's size - its pixel size divided by its scale, 1x
unless the file says otherwise - reach the state it draws the way the `**Walked:**` line says, and
save `captures/<capture>.running.png` over the author's. Judge your own picture. With no browser,
judge the author's and write `pictures: author's` in the report.

## Judge each picture

Judge that one state. A fact that lives in another state is not a gap in this picture. A click that
is not itself in the picture is not a gap when the resulting state is.

Open the capture and its picture together. First write the capture's inventory: one row per thing it
draws - each region, control, label and sentence, chip, state mark, line, legend entry, and the
arrangement of each region. Then mark every row `same` or `differs`, applying what
`## Differences from the source` lists, and for `differs` say what the picture draws instead. The
fix covers what the rows name and nothing else, so the inventory is the whole judgement: a thing no
row names is never checked.

What counts as `differs`:

- **controls** - a control the capture shows missing, or one it does not show
- **arrangement** - not the same regions in the same places, with the same nesting
- **copy** - visible text the capture fixes, wrong; a date that follows the day the picture was taken
  is not wrong
- **drawing** - an element drawn differently: a line, a border, a badge, the shape of a bar, the
  layout of a meter or a form
- **render** - overlapping, cut off, scrolled off the window, unreadable, or a component the rest of
  the app does not use

Exact spacing, shade and type weight are a note on a `same` row. A picture with one `differs` row
`diverges`; otherwise it `matches`.

## Report

Write `.specs/features/<feature>/screens.md`: the verdict table, then one inventory per picture.

```markdown
# <Feature> screens

**Verifier**: independent sub-agent (author != verifier)

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/billing--card-form.running.png` | `captures/billing--card-form.png` | diverges | 2 rows differ |

### `captures/billing--card-form.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| header: title `Billing`, close `×` on the right | same | |
| card form: number, expiry and CVC on one row | differs | expiry and CVC on a second row |
```

Return the rows that differ in chat; a diverging screen goes back with the Verifier's findings.

## The second round

There is one more round after a fix, and it is the last. A fresh screens sub-agent retakes only the
pictures with a `differs` row, opens only those rows, and marks each `same` or `differs` again. Rows
marked `same` stay as they were: what passed has passed. Nothing new is added to an inventory in this
round. What still differs goes to the user.
