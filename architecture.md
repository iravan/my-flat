# Architecture review

Review of the three flats in `web/lib/flat-plan.ts`, and the layouts I would draw instead.

Date: 2026-11-08. Dimensions in metres. North is the entrance side. South is the view.

The drawings in code are real shells, then stretched 1.5× in width and depth before they are shown. Ceiling height is not stretched. This review judges the real shells. A uniform stretch does not improve a plan: the bath, the entry, and the washer slot grow by the same amount as the living room. The larger plans at the end are designed room by room.

## Verdict

| Flat | As drawn (real) | What is wrong | Replace with |
| --- | --- | --- | --- |
| 清水樓 · 四人 | 6.9 × 5.2, 35.9 m², ceiling 2.55 | Washer is a 2.2 m dead-end. Living is only 3.0 m deep. Bath is large for this shell. | Same footprint, rebalanced |
| 清水樓 · 一人 | 3.4 × 4.3, 14.6 m², ceiling 2.55 | No entry. No kitchen window. The living room is 2.5 m deep, too shallow for a bed and a path. | A 3.0 × 4.9 slot |
| 日本 1LDK | 7.4 × 5.4, 40.0 m², ceiling 2.4 | Bedroom is 2.2 m wide. Genkan opens onto the kitchen. | Same area, bedroom 3.0 m wide |

What already works, and should stay:

- On the family 清水樓, only the kitchen and the bath are rooms. The rest is one shell until the tenant builds a wall.
- The family window wall has two openings and a solid pier between them, so a later bedroom still gets a window.
- The 1LDK keeps toilet, washroom, and bath as three rooms, and the bath is reached only through the washroom.
- Door height stays 2.05 m. Hong Kong ceilings stay 2.55 m. The Japanese ceiling stays 2.4 m.

## Furniture the plans have to hold

These are the sizes used to test each room.

| Piece | Size | Clearance |
| --- | --- | --- |
| Double bed | 1.53 × 2.03 | 0.60 beside or at the foot |
| Single bed | 0.97 × 2.03 | 0.60 on the open side |
| Sofa | 0.90 × 2.10 | 0.45 coffee table, 2.5–3.5 to the window wall if that wall holds the view |
| Table for four | 0.80 × 1.20 | 0.60 for each chair |
| Table for two | 0.75 × 0.75 | 0.60 for each chair |
| Kitchen counter | 0.60 deep | 1.00 aisle minimum, 1.20 comfortable |
| Washer | 0.60 × 0.60 | alcove 0.70 × 0.70 |
| Door leaf | 0.80 | the swing must miss the basin, the bed, and the shoe cabinet |

A room that cannot take its furniture with that clearance is too small, even if the area number looks acceptable.

---

## 1. 清水樓 · 四人

Real shell: 6.9 m frontage × 5.2 m deep, 35.88 m², ceiling 2.55 m. Shown in the game at 10.4 × 7.8 m, 81 m².

| Room | Size | Area | Wall |
| --- | --- | --- | --- |
| Kitchen | 2.4 × 2.2 | 5.28 | Walled, door to the living room |
| Entry | 1.3 × 2.2 | 2.86 | Open |
| Bath | 2.2 × 2.2 | 4.84 | Walled, door to the living room |
| Washer | 1.0 × 2.2 | 2.20 | One wall against the bath, open to the living room |
| Living · dining | 6.9 × 3.0 | 20.70 | Open |

```
north, corridor
┌──────────┬───────┬──────────┬───┐
│ Kitchen  │ Entry │   Bath   │ W │  2.2 deep
│ 2.4      │ 1.3   │   2.2    │1.0│
├──────────┴───────┴──────────┴───┤
│         Living · dining         │  3.0 deep
└════ window ═══════ window ══════┘
south, view
```

### What works

The organisation is the right one for a Hong Kong bare shell. Wet rooms sit on the corridor side. The long side faces the view. Kitchen and bath each have a small high window to the corridor or air well. The front door, 0.80 m clear, sits on the entry. The two south windows leave a pier a little over 2 m wide, which is where a bedroom wall can land later and still leave both rooms a window.

The kitchen width, 2.4 m, can take a 0.60 counter and a 1.20 aisle. That part is sound.

### What I would not keep

The washer niche is the full 2.2 m depth of the service strip. A washing machine is 0.60 m square. The other 1.6 m is a corridor with one use at the end. It reads as a room, and it is a poor one.

The bath at 4.84 m² is a comfortable family bathroom. Inside a 36 m² public-housing shell it is the room that has been given too much. A shower, a basin, and a toilet fit in 3.4–3.6 m². The extra square metre belongs to the living room.

The entry is 1.3 m wide. An 0.80 m leaf plus a 0.35 m shoe cabinet is 1.15 m, so it fits only when the cabinet stands beside the swing, hard against the kitchen wall. There is no place to stand while the door opens.

The living room is 6.9 m wide and only 3.0 m deep. A sofa on the service side sits about 2 m from the glass. That is close. Dining and living have to share a shallow band, so the table ends up in the walk from the entry to the window.

The kitchen run is short. Fridge, sink, and hob want about 2.4–2.7 m of counter in a line. The 2.2 m depth cannot be that line. The counter has to sit on the north wall, under the window. The door into the living room should sit toward the entry, so it does not cut the counter in half.

### Proposed plan — same 6.9 × 5.2 shell

Service depth comes down from 2.2 to 2.0. Living depth goes from 3.0 to 3.2. Area stays 35.88 m².

| Room | Size | Area | Role |
| --- | --- | --- | --- |
| Kitchen | 2.6 × 2.0 | 5.20 | Counter on the north wall under the window. Door to the living room at the entry end of the south wall. |
| Entry | 1.7 × 2.0 | 3.40 | Door centred. Shoe cabinet 0.35 m on the kitchen side, outside the leaf. |
| Bath | 1.8 × 2.0 | 3.60 | Shower 0.90 × 0.90 in the far corner, basin, toilet. High north window. Door to the living room. |
| Store | 0.8 × 2.0 | 1.60 | Tall cupboard from the entry side. Washer in a 0.70 × 0.70 recess where this bay meets the living room. |
| Living · dining | 6.9 × 3.2 | 22.08 | One room. The washer recess is a nick in the north-east corner, not a corridor. |

```
north, corridor
┌────────────┬─────────┬────────┬────┐
│  Kitchen   │  Entry  │  Bath  │ St │  2.0
│  2.6       │  1.7    │  1.8   │0.8 │
│  window    │  door   │ window │    │
├────────────┴─────────┴────────┴────┤
│ Living · dining          [washer]  │  3.2
│                                    │
└════ window ═════ pier ════ window ═┘
south, view
```

Widths: 2.6 + 1.7 + 1.8 + 0.8 = 6.9.

South windows: west opening centred near 1.5 m, 1.6 m wide; east opening centred near 5.6 m, 1.4 m wide. The pier between them is the bedroom wall, landing at 4.3 m from the west.

After that wall:

| Room | Size | Area | Fit |
| --- | --- | --- | --- |
| Living · dining | 4.3 × 3.2 | 13.8 | Sofa on the north wall, table for four toward the west window |
| Bedroom | 2.6 × 3.2 | 8.3 | Double bed along the east wall. 3.2 m of depth takes a 2.03 m bed and a path at the foot |

The bedroom shares no wall with the entry. The bath wall is on the bedroom's north side, so the headboard wants the east wall, away from the bath stack.

---

## 2. 清水樓 · 一人

Real shell: 3.4 × 4.3, 14.62 m², ceiling 2.55 m. Shown in the game at 5.1 × 6.5 m, 33 m².

| Room | Size | Area | Wall |
| --- | --- | --- | --- |
| Kitchen | 1.8 × 1.8 | 3.24 | Open to the living room. The front door is in its north wall. |
| Bath | 1.6 × 1.8 | 2.88 | Walled, door to the living room |
| Living | 3.4 × 2.5 | 8.50 | One south window |

```
north
┌──────────┬────────┐
│ Kitchen  │  Bath  │  1.8    door in the kitchen
│ (open)   │ walled │
├──────────┴────────┤
│ Living / sleep    │  2.5
└══════ window ═════┘
south
```

### What works

The area is a real 1–2 person Housing Authority figure. The bath, at 2.88 m², is the right size. One south window is the right number for a single-aspect room. The bath is the enclosed room. That matches a bare shell.

### What I would not keep

The front door occupies the kitchen's only outside wall, so the kitchen has no window. Steam and smoke have nowhere to go except across the bed.

There is no entry. Shoes, the hob, and the pillow are one volume.

The living room is 2.5 m deep. A single bed is 2.03 m long. Laid across the depth it leaves 0.47 m, which is not a path. Laid along the window it is 0.97 m deep and leaves 1.5 m, which is a corridor with a bed in it. This room cannot be both a bedroom and a place to sit.

### Proposed plan — 3.0 × 4.9 slot, 14.7 m²

Turn the unit into a short slot. The door is on the short north end. Sleeping gets the depth.

| Room | Size | Area | Role |
| --- | --- | --- | --- |
| Entry | 3.0 × 1.1 | 3.30 | Door and shoes. The bath door opens here, so a wet door does not swing at the bed. |
| Kitchen | 1.6 × 1.7 | 2.72 | Open to the south. Counter and window on the west wall. |
| Bath | 1.4 × 1.7 | 2.38 | Shower, basin, toilet. Door to the entry. |
| Living / sleep | 3.0 × 2.1 | 6.30 | Single bed along the west wall, desk under the south window. |

```
north, door
┌────────────────────┐
│ Entry        1.1   │
├──────────┬─────────┤
│ Kitchen  │  Bath   │  1.7
│ 1.6      │  1.4    │
│ open ↓   │  door ↑ │
├──────────┴─────────┤
│ bed │    path      │  2.1
│     │    desk      │
└═════╧═══ window ═══┘
south
```

1.6 + 1.4 = 3.0. Depths 1.1 + 1.7 + 2.1 = 4.9. Area 14.70 m².

The bed is 0.97 × 2.03 along the west wall. The 2.1 m depth holds it with a few centimetres to spare. The remaining width, about 2.0 m, is the path and a desk at the window. This is a one-person room. It does not pretend to be a living room with a sofa and a dining table.

A high window on the bath's west or east wall keeps the bathroom from being a closed box. The kitchen window is on the side wall, because the north wall is the entry.

---

## 3. 日本 1LDK

Real plan: 7.4 × 5.4, 39.96 m², ceiling 2.4 m. Shown in the game at 11.1 × 8.1 m, 90 m².

Service strip, 1.8 m deep, from the west:

| Room | Width | Area |
| --- | --- | --- |
| Genkan | 1.6 | 2.88 |
| Toilet | 1.0 | 1.80 |
| Washroom | 1.6 | 2.88 |
| Bath | 1.6 | 2.88 |
| Closet | 1.6 | 2.88 |

Main rooms, 3.6 m deep:

| Room | Width | Area | Wall |
| --- | --- | --- | --- |
| Kitchen | 2.2 | 7.92 | Open to the living room. Window on the west wall. |
| Living | 3.0 | 10.80 | South window |
| Bedroom | 2.2 | 7.92 | South window. Door to the living room. Closet door in the north wall. |

### What works

Toilet, washroom, and bath are separate, and the bath is entered from the washroom. That is the usual Japanese sequence. The closet opens to the bedroom. The kitchen is open to the living room, which is what the L in 1LDK is for. Ceiling height 2.4 m is the right figure. The west kitchen window and the two south windows put light on the long side and on the bedroom.

The toilet at 1.0 × 1.8 is usable. I would rather see 1.1 × 1.7, so the door swing and a person are not the same square of floor.

### What I would not keep

The bedroom is 2.2 m wide and 3.6 m deep. A double bed is 1.53 m wide and needs 0.60 m to walk past. That sum is 2.13 m. The closet door and the bedroom door both open into the remaining strip. There is no side of the bed to stand on and no wall long enough for the headboard that is not a door or a window. A bedroom in a 1LDK wants 2.7 m of width at the minimum, and 3.0 m if it is going to feel like a room.

The genkan opens into the kitchen. Guests take their shoes off in front of the hob. The genkan should step up into a hall, and the hall should be the north edge of the living room. The kitchen sits beside that hall, screened by the end of the counter.

The living room is 10.8 m² and has to be both sitting and eating. A table for four (0.80 × 1.20 plus chairs) and a sofa do not both sit here with a path from the genkan to the bedroom. At 40 m² the honest dining table is for two, or the table is the kitchen counter.

The closet is 1.6 × 1.8, which is a good size, and it sits north of the bedroom, which is the right place. It currently occupies the whole north side of a bedroom that is the same width, so the bedroom's north wall is closet and the bath's south wall. Widening the bedroom past the closet gives a solid piece of north wall for the headboard.

### Proposed plan — 8.0 × 5.1, 40.8 m², ceiling 2.4

| Room | Size | Area | Role |
| --- | --- | --- | --- |
| Genkan | 1.8 × 1.7 | 3.06 | Step up into the living room, not into the kitchen. Shoe shelf on the west wall. |
| Toilet | 1.1 × 1.7 | 1.87 | Door to the hall at the north edge of the living room. |
| Washroom | 1.6 × 1.7 | 2.72 | Door to the living room. Door to the bath. |
| Bath | 1.6 × 1.7 | 2.72 | Reached only from the washroom. Small high north window. |
| Closet | 1.9 × 1.7 | 3.23 | Door from the bedroom only. |
| Kitchen | 2.2 × 3.4 | 7.48 | Galley on the west wall under a side window. Open to the living room. Counter end screens the sink from the genkan. |
| Living | 2.8 × 3.4 | 9.52 | South window. Sofa and a table for two. |
| Bedroom | 3.0 × 3.4 | 10.20 | Double bed against the north wall, east of the closet. Path at the foot. South window. Door from the living room on the west wall, clear of the bed. |

```
north
┌────────┬─────┬───────┬───────┬────────┐
│ Genkan │ WC  │ Wash  │ Bath  │ Closet │  1.7
│  1.8   │ 1.1 │  1.6  │  1.6  │  1.9   │
├────────┴─────┴───────┴───────┴────────┤
│ Kitchen │   Living · dining  │ Bedroom │  3.4
│  2.2    │        2.8         │   3.0   │
│ west    │     south window   │  south  │
│ window  │                    │ window  │
└─────────┴────────────────────┴─────────┘
```

Service widths: 1.8 + 1.1 + 1.6 + 1.6 + 1.9 = 8.0.
Main widths: 2.2 + 2.8 + 3.0 = 8.0.
Depth: 1.7 + 3.4 = 5.1. Area 40.80 m².

The bed, 1.53 × 2.03, sits on the north wall. The room is 3.4 m deep, so the foot of the bed leaves about 1.3 m. The door from the living room is in the southern half of the west wall, so it opens onto that path. The closet takes 1.9 m of the bedroom's north side. The other 1.1 m of north wall is solid, which is enough for the head of the bed if the bed is shifted east, or the bed centres on the north wall and overlaps the closet wall. Either way the pillow is not under the window.

At this area the living room does not get a table for four. That is a limit of 40 m², and the plan should show a table for two.

---

## Sweet dream

The 1.5× model currently in the game takes each of the drawings above and multiplies width and depth. The family washer niche becomes 1.5 × 3.3 m. The family bath becomes about 7.3 m². The one-person living room becomes 3.75 m deep and is still the wrong shape for how the bed wants to sit, only larger. The 1LDK bedroom becomes 3.3 m wide, which happens to fix that one room, and the genkan still opens onto the kitchen.

A sweet dream of these flats is a larger living room and a larger bedroom, with the wet rooms left at the sizes that already work.

### Family dream — 7.8 × 6.4, 49.9 m², ceiling 2.55

Same organisation as the revised 清水樓. The extra area is almost all living-room depth.

| Room | Size | Area |
| --- | --- | --- |
| Kitchen | 2.8 × 2.1 | 5.88 |
| Entry | 1.8 × 2.1 | 3.78 |
| Bath | 2.2 × 2.1 | 4.62 |
| Store | 1.0 × 2.1 | 2.10 |
| Living · dining | 7.8 × 4.3 | 33.54 |

```
north
┌──────────┬────────┬─────────┬────┐
│ Kitchen  │ Entry  │  Bath   │ St │  2.1
│   2.8    │  1.8   │   2.2   │1.0 │
├──────────┴────────┴─────────┴────┤
│                                  │
│     Living · dining    4.3       │
│     sofa, table for four         │
│                                  │
└════ window ════ pier ════ window ┘
south
```

A later bedroom wall on the pier can take a 3.2 × 4.3 m bedroom (13.8 m²) and still leave a 4.6 × 4.3 m living room (19.8 m²). Four people can sit. The bath at 4.6 m² is now earned, because the living room is no longer 3 m deep.

Washer: a 0.70 m recess off the living room at the store, as in the small shell.

### One-person dream — 3.4 × 6.2, 21.1 m², ceiling 2.55

The slot, with enough depth to add a real seat that is not the bed.

| Room | Size | Area |
| --- | --- | --- |
| Entry | 3.4 × 1.3 | 4.42 |
| Kitchen | 1.8 × 1.8 | 3.24 |
| Bath | 1.6 × 1.8 | 2.88 |
| Living / sleep | 3.4 × 3.1 | 10.54 |

```
north, door
┌──────────────────────┐
│ Entry           1.3  │
├───────────┬──────────┤
│ Kitchen   │   Bath   │  1.8
│   1.8     │   1.6    │
├───────────┴──────────┤
│ bed │  path │  seat  │  3.1
└═════╧════ window ════┘
south
```

A single bed along the west wall, a chair and a small table at the window, a path between them. Still one person. The kitchen has a side window. The bath door opens to the entry.

### 1LDK dream — 10.0 × 5.6, 56.0 m², ceiling 2.4

The revised 1LDK with the living room and the bedroom given the metres the 40 m² plan could not spare.

| Room | Size | Area |
| --- | --- | --- |
| Genkan | 2.4 × 1.8 | 4.32 |
| Toilet | 1.2 × 1.8 | 2.16 |
| Washroom | 1.8 × 1.8 | 3.24 |
| Bath | 1.6 × 1.8 | 2.88 |
| Closet | 3.0 × 1.8 | 5.40 |
| Kitchen | 2.4 × 3.8 | 9.12 |
| Living · dining | 4.2 × 3.8 | 15.96 |
| Bedroom | 3.4 × 3.8 | 12.92 |

```
north
┌─────────┬─────┬───────┬──────┬──────────┐
│ Genkan  │ WC  │ Wash  │ Bath │  Closet  │  1.8
│   2.4   │ 1.2 │  1.8  │  1.6 │   3.0    │
├─────────┴─────┴───────┴──────┴──────────┤
│ Kitchen │    Living · dining   │ Bedroom │  3.8
│   2.4   │         4.2          │   3.4   │
└─────────┴──────────────────────┴─────────┘
```

The living room holds a sofa and a table for four. The bedroom holds a double bed, a path on both the foot and one side, and a chair. The closet is large because the spare width landed beside the bed; it still opens only from the bedroom. Genkan, kitchen, and the three wet rooms keep the same relationships as the 40 m² plan.

---

## Light, order, and finish

These apply to every plan.

The south wall is the daylight wall. Sills stay near 0.85–0.90 m so a table can sit under the glass and a bed does not have to. North windows on kitchens and baths stay small and high, around a 1.3–1.4 m sill, because that side is a corridor or an air well.

The entry floor should be a different surface from the rooms beyond it, even in a bare shell: tile or a darker screed for about 1 m inside the door, then the room floor. Shoes stop there. In the 1LDK that line is the step up out of the genkan.

One ceiling light belongs over the table, or over the centre of the living room. A light over the door leaves the depth of the room dark.

When the family shell is partitioned, the bedroom takes the window farther from the entry and shares as short a wall as possible with the bath. The bath stack stays on the corridor side so the drains do not cross the living room.

Finish for the 清水樓 plans stays what a handover looks like: skimmed off-white walls, grey screed, no skirtings pretending the flat is furnished. The 1LDK can be the warmer japandi set already in the styles. The sweet-dream plans use the same finishes. The difference is the size of the living room and the bedroom.

## What to draw next

If these replace the three plans in the game, draw them in this order:

1. The revised 6.9 × 5.2 family shell. Same site, washer and entry corrected, living room 3.2 m deep.
2. The 3.0 × 4.9 one-person slot, in place of the current studio.
3. The 8.0 × 5.1 1LDK, bedroom 3.0 m wide, genkan opening to the living room.

Keep the 1.5× multiplier off those drawings. The three sweet-dream plans are the larger designs, for when the virtual flat is allowed to be generous on purpose.
