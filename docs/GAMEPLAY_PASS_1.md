# Gameplay Pass 1

Scope: Plaza -> Bosque only. No new regions, curriculum, NPC or educational XP.

Audited: movement and camera in World3DView, characterActions/equipment and real
rig sockets, CollisionWorld, Adventure State and profile persistence, local
Skeleton General/Movement clips, KayKit containers and the existing pet follower.
No pottery model exists in the audited container set; boxes/barrels/keg are used.

Authoring: composition/toyComposition.js is attached to Plaza/Forest as gameplay.
For this local vertical slice it replaces only those two regions' worldActions
at rendering time. Other regions retain their Content Platform placements.
The new layout is not yet exposed in the administrative World Editor. No backend
content or lesson records are rewritten to install the prototype.

Five destructibles, two skeletons (2/3 hits), eight route notes, six dropped notes
and three notes in a forest nook. No trees or macro terrain are moved.
Notes and defeated toy targets live in adventure.toy, saved under the existing
per-profile local Adventure key. Version 2 saves gain this optional field;
old saves remain readable. No cross-device persistence or educational rewards.
Drops spawn at the defeat position during play; after reload, uncollected drops
return to their authored home positions. Enemy defeats do not respawn after reload.

Q and E use the equipped actions: real attack clips cause damage; Block/Dodge
remain defensive, not fake attacks. Enemy attacks keep their actual Throw clip.
Materials are cloned for hit flashes; caches are never recolored or disposed.
Pickup tones have a separate small AudioContext with explicit gesture unlock,
muting and cleanup; PianoMagico and microphone processing are untouched.

QA recorder: scratch/toy-playtest-recorder.html (ignored, never deployed).
MediaRecorder records the live WebGL canvas, not a sequence of screenshots.
The recording captures image only, not piano or system audio.

Human approval required. No commit, push or deployment for this pass.

## Verification (2026-10-12)

- 244 automated tests pass; production build passes. Existing JSON-import and
  large-bundle warnings remain. No new browser console errors in the tested tab.
- Real normal-mode play: route pickup, first box destruction and drop pickup,
  Skeleton pursuit/strikes/player knockback, two-hit defeat and reward pickup,
  forest nook pickups, then walking onward toward existing lesson chests.
- Knight with two swords and Panda follower tested. Map opens/closes and retains
  existing discoveries/objective. Reload restores local toy progress per profile.
- Plaza practice -> PianoMagico -> correct virtual DO -> cancel -> world verified;
  player returns near the same chest with notes/pet intact. The correct piano note
  awarded the existing educational 100 XP (6700 -> 6800); toy pickups awarded none.
- Video: Documents/Codex/Valle-Gameplay-Pass-1-final.mp4, actual moving canvas
  footage edited chronologically to remove waits; middle travel segment is 2x.
  No sound or DOM HUD is recorded. No screenshot slideshow or synthetic frames.
- Desktop views at 783x670 and 1159x668 rendered correctly. Mobile viewport
  override did not apply in this browser; physical mobile QA remains pending.
- Not certified here: physical microphone, listening balance on speakers,
  every equipment combination, manual destruction of all five props and manual
  defeat of both skeletons. Logic/asset/collision tests cover those definitions.
- Camera still has existing terrain/vegetation constraints around the nook;
  human review of combat readability/density is required, not auto-approved.
