# AGENTS.md - Laravel Game Template

Work only inside this independent repository. Never modify PixelSurvivor, game-base,
sibling projects or Windows settings. Communicate in Russian; English code and
identifiers are appropriate. The current user task takes precedence over historical
Pixel Survivor plans and reports, including their old prohibitions against Laravel.

## Architecture
- Laravel is the primary application at the repository root. Keep one application.
- Phaser and its Vue game interface live in `game/`, never `packages/game/`.
- Website UI lives in `resources/`; Phaser owns gameplay, collision and scene timing.
- Preserve `PlatformPort`: game -> platform adapter -> session-authenticated internal
  Laravel routes -> existing services. No database access from the game.
- Browser JSON routes live under `/internal`, using the web middleware stack,
  existing authorization, verification, validation, throttling and CSRF protection.
  There is no public versioned API or separate mobile backend.
- Keep external payment webhook URLs, signature checks and CSRF exceptions intact.
- Use one Node dependency installation and lockfile. Keep Phaser out of website SSR.
- Serve approved runtime assets from `public/game-assets/`; preserve their bytes.

## Implementation and verification
- Read the current task, relevant architecture documentation and `docs/PROGRESS.md`.
  `PLAN.md` is historical gameplay context, not the current architecture mandate.
- Implement autonomously; record material choices in `docs/DECISIONS.md`.
- Preserve business functionality, financial history formats, exactly-once grants,
  inventory consistency, idempotency and recovery. Do not rewrite financial services
  or change gameplay balance during structural work.
- Never use production/development databases for destructive tests. Use isolated
  SQLite or explicitly guarded MySQL test databases. Never copy credentials or
  private runtime data into Git.
- Run relevant tests after meaningful changes, fix type/lint/build failures, and
  report actual evidence and limitations. Never disable assertions to pass a check.
- Diagnose after at most three failed repetitions of an approach.
- Update `docs/PROGRESS.md` with changes, checks, screenshots, blockers and next work.
- Verify Canvas visually with screenshots, not only DOM snapshots. Preserve bounded
  entity counts, event snapshots and explicit scene/input/listener cleanup.
- Do not create task completion markers before all acceptance criteria pass.
- Do not commit, push, deploy, request admin rights/credentials/payments, or invoke
  `--yolo` without explicit user authorization. Do not send messages externally.

## Art provenance
- Do not regenerate assets during an architecture refactor. Keep historical art
  approvals, prompts, seeds, job IDs and source references unchanged.
- Maintain `docs/art/PIXELLAB_PROMPT_JOURNAL.md`: append accepted prompts only after
  explicit user approval; distinguish programmatic assets and rejected trials.
- Before Warrior generation read `docs/art/PIXELLAB_GENERATION_GUIDE.md`. Preserve
  the accepted SOUTH Whirlwind 12-frame PixMiniMax + Enhance recipe. Northern source
  is cell 4 of `art/warrior/8-proections.png`: N/NE direct, NW mirrored. New clips
  require user selection; the shield-facing-camera reference remains rejected.
