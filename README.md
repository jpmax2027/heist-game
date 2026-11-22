# Vaultbreak — The Meridian Job

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/competitions/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/jpmax2027/heist-game/rank.svg)](https://make.fun/competitions/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/jpmax2027/heist-game/reward.svg)](https://make.fun/competitions/best-heist-game-20261122-0559)

A top-down stealth heist game that runs entirely from static files in a desktop browser — no build step, no network, no outside assets. One night, one bank, one getaway van.

You are the thief breaking into the Meridian Bank after dark. Cross the lobby, the main hall and the vault room without ever being seen, crack the vault, grab everything that glitters, and reach the van before the alarm hits 100%.

## How to play

Serve `game/` with any static server and open `index.html`:

```sh
python3 -m http.server 8080 --directory game
```

Then open <http://localhost:8080> in desktop Chrome.

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| Shift (hold) | Sneak — slower, harder to spot |
| E (hold, at the vault) | Crack the vault (3 seconds, noisy) |
| Q | EMP blast — kills every camera for 9 seconds (1 use) |
| F | Smoke bomb — cones cannot see through the cloud (1 use) |
| M | Mute |
| Mouse | Look direction |
| Enter / click | Start · R / click | Retry after caught or escaped |

## The job

- **Three guards, three patrols.** Rudi walks the lobby, Sari sweeps the hall, Bowo guards the vault room. Their vision cones are yellow when calm, orange when suspicious, red when they are coming for you. A full detection ring over a guard's head means run.
- **Three CCTV cameras** sweep the halls on their own rhythm. Getting spotted by a camera fills the alarm faster than a guard does.
- **The alarm meter** (top centre) is the whole game: every second you are seen pushes it up, and at 100% the bank locks down with you inside. Break line of sight and it slowly falls again.
- **Loot everywhere:** cash stacks ($400–$800), a gold bar ($1,500), a jewel case ($2,000) — and $5,000 inside the vault itself. Your score is loot plus a stealth bonus for alarm left over plus a time bonus.
- **Two routes per room:** the front doors through the hall, or the vent along the top of the bank that drops you straight into the vault room. The vent is the quiet way in; the hall is the rich way in.
- **Tools at a cost:** one EMP and one smoke bomb per run. Spend them early and the vault room is blind; spend them late and the getaway is safe. You cannot have both.
- **Fair catches:** guards pause and stare while they get suspicious, and the alarm always warns you before it kills the run. Getting caught shows exactly who caught you; escaping shows the full score breakdown.

## Sound

Every sound is synthesised in code with WebAudio — footsteps, pickup chimes, vault-crack ticks, the alarm, and a low ambient hum. There are no audio files.

## Layout

```
game/
  index.html        page shell, loads the game
  src/
    config.js       tuning, colours, balance numbers
    input.js        keyboard + mouse state
    levels.js       the bank floor plan: rooms, walls, loot, patrols, cameras
    guards.js       patrols, vision cones, suspicion and chase
    cameras.js      CCTV sweep cones and EMP shutdown
    loot.js         loot pickup, vault cracking, EMP and smoke tools
    audio.js        WebAudio synth: steps, alarm, ambience
    render.js       every pixel: floor, cones, HUD, minimap, screens
    main.js         game loop, states, score, ?shot= staging
main.ts             hand-in program: copies game/ + screenshots/ to /output,
                    writes dossier.json with vendor/makefun-game.ts
screenshots/       1-start, 2-play (cover), 3-vault, 4-escape
```

Screenshot staging: `?shot=start` shows the title screen, `?shot=play` the mid-heist cover scene (thief, guard cones, cameras, loot and the alarm meter in one frame), `?shot=vault` the vault crack, and `?shot=escape` the getaway. Each shot is a fixed, deterministic scene.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Built for the make.fun best heist game bounty: https://make.fun/competitions/best-heist-game-20261122-0559 — https://make.fun/r/zbqpv30a
