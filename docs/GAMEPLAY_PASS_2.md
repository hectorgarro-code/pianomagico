# Gameplay Pass 2: musical world interaction

Base: existing Gameplay Pass 1 working tree, preserved without reset or commit.
One authored optional mechanism in the western Forest shoulder (-6, -29).
Main route, existing trees, enemies, destructibles and lessons remain unchanged.

Composition owns assets, symbols, sequence and reward positions. The world
renderer materializes real KayKit gate/pillars, bitmap rune labels, illumination
and physical door lift. Click/tap a stone or its musical glyph to answer.
Keyboard 1/2/3 is an equivalent input, not a different screen.

Only SEQUENCE_MEMORY is implemented. The contract reserves NOTE_RECOGNITION,
HIGH_LOW, RHYTHM and MELODY_ORDER; unsupported types fail explicitly.
The existing miniAnswer evaluator is reused for one authored C4/E4/G4 sequence.
No PianoMagico scoring, microphone, lesson records or educational XP changes.

Listen and input run inside the world. Errors flash softly and replay after
one second; walking away resets incomplete input. Map/menu/piano pause world
updates and note playback. Completion is local in adventure.toy.completedMechanisms,
per profile under the existing Adventure key; no backend analytics or database
schema changes. Reload starts a completed gate open, not another reward claim.
Three Lost Notes require completion even if the player walks around the gate.
This is a small reward lock, not a new sealed corridor or main progression gate.

No commit, push or deployment. Human approval required.

## QA

- Real normal-mode test with QA GAMEPLAY CONTENT 1 / Knight / two swords / Panda:
  approach, listening, wrong SOL click, soft retry, correct DO/MI/SOL clicks,
  physical door lift and pickup of all three rewards (notes 16 -> 19; XP 6800).
- Reload restores OPEN and collected notes. Map and objective remain available;
  existing enemies/destructibles are not relocated or replaced by this pass.
- Runtime tests cover raycasting, error/retry, one-time completion, delayed
  removal of the door collider, persistent stone/frame colliders and cleanup.
- 249 tests pass; build passes with existing asset-import/bundle warnings.
- Real short video: Documents/Codex/Valle-Gameplay-Pass-2.mp4. Chronological cuts
  remove idle testing waits; canvas footage only, no recorded audio or HTML HUD.
  Final camera retains close framing while the player remains near an open gate.
- Pending human QA: musical balance on speakers, physical touch/mobile, interaction
  with a hostile enemy actively pursuing into the mechanism area, visual approval.
