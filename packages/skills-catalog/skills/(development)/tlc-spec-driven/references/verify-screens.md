# Verify Screens

A fresh sub-agent judges the screens a capture draws, and nothing else. It runs beside the Verifier whenever a criterion cites a capture. It writes the verdict the gate reads.

## What It Receives

- `spec.md`, this file and the captures.
- The `**Walked:**` line from the Handoff of tasks.md. It says how the user reaches each state.

It never receives the checks, the diff or the rest of the Handoff. Those carry the judgement of whoever built the screen.

## Take the Pictures Yourself

The author's picture is the author's claim. A picture taken in a wider window and resized to the capture's size looks like a match. At the real size, the page shows a different layout.

So open the running app in a browser window at each capture's size. That size is the pixel size divided by the scale, which is 1x unless the file says otherwise. Reach the state the capture draws the way the `**Walked:**` line says. Save `captures/<capture>.running.png` over the author's picture, and judge your own. With no browser, judge the author's picture and write `pictures: author's` in the report.

## Judge Each Picture

Judge that one state. A fact that lives in another state is not a gap in this picture. A click that is not in the picture is not a gap when its resulting state is.

Open the capture and its picture together. First write the capture's inventory, one row per thing it draws. Rows cover each region, control, label, sentence, chip, state mark, line and legend entry. They also cover the arrangement of each region.

Then mark every row `same` or `differs`, and apply what `## Differences from the source` lists. For a `differs` row, say what the picture draws instead. The fix covers what the rows name and nothing else. So the inventory is the whole judgement, and a thing no row names is never checked.

What counts as `differs`:

- **Controls.** A control the capture shows is missing, or one it does not show is there.
- **Arrangement.** The regions are not in the same places with the same nesting.
- **Copy.** Visible text the capture fixes is wrong. A date that follows the day the picture was taken is not wrong.
- **Drawing.** An element is drawn differently: a line, a border, a badge or the shape of a bar. The layout of a meter or a form counts too.
- **Render.** Something overlaps, is cut off, scrolls off the window or is unreadable. Or a component appears that the rest of the app does not use.

Exact spacing, shade and type weight are a note on a `same` row. A picture with one `differs` row `diverges`. Otherwise it `matches`.

## Report

Write `.specs/features/<feature>/screens.md`: the verdict table, then one inventory per picture.

```markdown
# <Feature> screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 1

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/billing--card-form.running.png` | `captures/billing--card-form.png` | diverges | 2 rows differ |

### `captures/billing--card-form.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| header: title `Billing`, close `×` on the right | same | |
| card form: number, expiry and CVC on one row | differs | expiry and CVC on a second row |
```

Return the rows that differ in chat. A diverging screen goes back with the Verifier's findings.

## The Second Round

One more round follows a fix, and it is the last. A fresh screens sub-agent retakes only the pictures with a `differs` row. It opens only those rows and marks each `same` or `differs` again. Rows marked `same` stay as they were, because what passed has passed.

Nothing new is added to an inventory in this round. It sets `**Round**: 2`. A screens.md already at round 2 gets no further round. What still differs goes to the user.
