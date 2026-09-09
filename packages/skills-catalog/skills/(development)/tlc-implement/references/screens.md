# Screens

**Read this only under `profile: ui`.** Under `light` or `standard` the interface is out of
scope for the checks, and loading this file costs a run that will not use it.

## The design decides, the check records

**On a screen the concrete values live in the design, so open it before writing the check.**
"Renders the intake" and "the body includes montando" pass under any interface at all - that is
"gracefully" wearing a string literal. Not fidelity, which no exit code settles, but the values
that are assertable and only the design carries: which elements exist, what the labels say, what
the step counter reads, whether a state is its own screen or a band on one that already exists.
Named, they are settled by the runner like every other check.

**A design is binding, not reference.** When a check and the design disagree, the check is wrong
until the user says otherwise. This is the failure worth naming, because it does not look like
one: a checklist that contradicts the design ships the contradiction with every proof green, and
the build is then correct against the artifact and wrong against the decision.

**It also outranks the screen that is already there.** Reuse is about components - the card, the
button, the container - never about a layout the design replaced. When the feature lands on an
existing screen and the design draws that screen differently, the old composition is the thing
the change is for; keeping it because it was already built is the most comfortable way to ship
the wrong screen with every check green.

## When the repo has a design system

Both are binding and they do not collide, because they decide different things. **The design
decides structure and hierarchy** - which regions exist, what contains what, which indicator, in
what order. **The system decides the values that realise it** - the colour token, the type scale,
the spacing scale, the component that already exists.

So never lift a hex or a font family out of a mock into a repo that has tokens: that breaks
theming, and the system is right. And never surrender the arrangement on the way there. "Use the
tokens" answers colour and answers nothing at all about whether the progress indicator is a ring
or a bar. Where a value in the mock has no token to land in, that is a finding for the user, not
a licence to redraw the screen around what the system already had.

## Open it, and say how

**Resolve it before writing a screen check, and do not assume you cannot.** Most designs are
reachable: an artifact URL opens with a fetch, a design file opens through its MCP where one is
connected, an attachment on a tracker issue comes down through that tracker's API, and an image
committed to the repo is a file to read. Work through whatever the environment actually offers,
then say which route worked - "the link was in the ticket" and "I opened the design" are
different claims, and only one of them is evidence.

**Opened means you saw the screens, not that a fetch returned bytes.** A design attachment often
arrives as something that is not an image: a JS bundle, an archive, a page whose markup is a
loader. Downloading that and recording the source as opened is the worst of the three outcomes,
worse than reporting it unreachable, because the checklist then claims an authority nobody
consulted and every later step trusts the claim. If you cannot see the arrangement, the design is
**unresolved** - say what came back, mark the screen checks as written without it, and let the
`Unproven` column carry the composition.

Falling back is allowed; doing it silently is not, and neither is falling back without trying -
a link reported as inaccessible on the strength of its domain is a fabricated fact, not caution.
When nothing resolves, record against the entry in `Sources` what you attempted and what came
back, build the screen checks from the values the task transcribed, and mark those checks as
written without the design. An unresolved design is a finding somebody can act on; an
unmentioned one is what produces the wrong screens.

## How far a screen check reaches

How far a screen check reaches is the same question as any other level and has the same answer:
whatever the repo already asserts. Where a suite drives a browser, a screen check can live there;
where only request tests exist, structural assertions are the ceiling. Never bring in a browser
stack to satisfy this - a proof that cannot run in the project's own setup is worse than none, and
this skill installs nothing.

What the ceiling leaves out is far narrower than it sounds, and overstating it turns this into an
amnesty. A selector reaches presence, absence, order, count, text **and containment**: that a
progress bar is in the markup, that no breadcrumb is, that the primary button comes before the
secondary, that the counter reads `1 de 3`, that `AGORA` sits inside the week band rather than
beside it. All of that is an ordinary check and none of it is exempt. What no selector reaches is
spacing, colour and type weight.

**Composition is assertable, so it is not exempt either.** Which regions the screen has, what
contains what, a bar where the design draws a bar and not a ring - those are presence,
containment and order wearing a visual name, and a list of the assertable that leaves them out
hands the arrangement back by accident. This is the failure this section has actually produced:
every label copied, every count correct, and a screen that reads as a different product. So write
the structural checks the design decides - one column or two, this indicator and not that one,
this block nested inside that one - and leave only the three properties above unproven.

So the exemption has to enumerate, under the same rule as every other negative in this skill.
"Visual fidelity is unproven" is a blanket that legitimises every mistake of form written after
it - including the ones a check would have caught - and a verifier reading it treats a real gap as
a limitation properly declared. Name the screen and the property: `03 overview - spacing and card
elevation unproven`. Then a person reviews three lines instead of being handed the whole surface
back.

## The Screens table needs a column for arrangement

Give the artifact a `## Screens (ui)` section with one row per screen and **three** columns, so
the omission shows up as an empty cell rather than as a shorter sentence:

```markdown
| Screen | Copy and elements (selector) | Arrangement (selector) | Visual unproven |
| --- | --- | --- | --- |
| 01 mid-cycle | kicker `CICLO DE {N} DIAS`, `dia K de N`, `ESTA SEMANA`, `AGORA`, Continuar, Deixar para depois, Regenerar | progress is a **bar**, not a ring · `AGORA` nested **inside** the week band, between last-opened and next · community in **two** columns · stages as numbered circles on a rail · footer: feedback left, Regenerar right | spacing, colour, type weight |
```

The middle column is the one this whole file exists for. Without it a row reads as complete with
nothing but labels in it - which is how a screen ships with every string correct and a layout
nobody decided. Each item there is an ordinary check: presence, absence, containment, order,
count. What genuinely does not reach goes right, named, per screen.

## Screens are a Coverage set

**Designed screens are a set whose members are the screens.** The design already numbers them, so
the enumeration exists and owes a row like any other. The row is what forces the artifact open,
which is exactly where this fails: a screen nobody mapped is a screen nobody built, and it stays
invisible while every check is green. Map each screen to the check that renders it and leave the
rest in `Unproven`.

```markdown
| designed screens (6) | `01` intake C1 · `02` montando C5 · `03` overview C19 · `04` player C26 · `05` conclusão C20 | `06` |
```

Where the design draws a state as a band on an existing screen and a check turned it into a
screen of its own, that is not a gap but a contradiction - say so in the row and settle it with
the user, because the check is the side that is wrong.

And mark the design in `Sources` as binding for the interface, naming the screens it covers:

```markdown
- <design URL or path> - **binding for the interface**: screens 01-06
```
