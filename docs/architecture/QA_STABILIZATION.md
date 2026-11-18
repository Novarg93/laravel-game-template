# QA Stabilization — Laravel Game Template

> **Финализация active QA (2026-11-18):** текущие проверки разделены с исторической
> приёмкой по явному заданию пользователя. Активный Vitest: **143 файла / 1046 PASS**;
> полный TypeScript актуального website/game и всех активных тестов проходит.
> Архив `tests/historical/`: 62 исходных unit-файла / 414 кейсов, прежние **38 FAIL**,
> 29 failing files и одна collection error; historical typecheck сохраняет
> **10 diagnostics**. Все исходные assertions и golden fixtures сохранены.
> Восемь replay остаются с **недоказанной совместимостью**, hashes не переписаны.
> MySQL diagnostic: **1045, writes: 0**. Отчёт и CI: [ACTIVE_CI.md](ACTIVE_CI.md).
> Ниже сохранены результаты предыдущего этапа QA, до разделения наборов.


Дата: 2026-11-18. Рабочая область: только `Novarg93/laravel-game-template`.

## Точное состояние готовности

**Полная приёмка не закрыта; шаблон не объявлен production-ready.** Текущие сайт,
Phaser runtime и финансовые сценарии проходят выполненные регрессии. Сохраняются
непроверяемые исторические художественные assertions, восемь несовпадений golden
replay, отсутствующие review-модули TypeScript и недоступная аутентификация MySQL.
Нельзя делать вывод о совместимости со старой симуляцией без её подлинного source.

PHP/Laravel архитектура, бизнес-правила, payloads, баланс, дизайн и ассеты не менялись.
943 исходных файла приложения/game/public сверены с checkpoint начала QA:
все побайтово совпадают. Единственное изменение конфигурации приложения — выбор
реального HTML entry для standalone dependency optimizer Vite. Новые scripts/helpers
относятся к диагностике и проверкам. Никакой генерации изображений, подмены
принятых proofs или обновления golden-хэшей не было.

## Сохранность работы и поиск исходников

На старте: ветка `main`, HEAD `3a7f359653df8c77c1714d04beea283ae1f08d19`, staged=0.
Миграция Laravel-first оставалась незакоммиченной. Создана локальная точка
восстановления `.tmp/qa-recovery-20261118/`:

- `worktree.zip`: 1488 существующих tracked/nonignored untracked файлов; CRC проверен.
- `repository.bundle`: история Git, проверена через `git bundle verify`.
- Два binary patch, исходный porcelain status и manifest с SHA-256/deleted paths.
- Ни один существовавший на старте файл QA не удалён. Staged-состояние не менялось.
- Высокоточные паттерны private keys, live Stripe/GitHub/AWS tokens не найдены
  в текущих tracked/nonignored файлах и HEAD. Тестовые синтетические credentials
  остаются явно тестовыми. Приватный `.env` и runtime databases не архивировались
  и не включались в Git. Значения secrets не выводились.

Искались только файлы внутри этого репозитория, его локальные Git objects/refs и
его история через GitHub connector. Текущий GitHub-репозиторий содержит только
[Initial import](https://github.com/Novarg93/laravel-game-template/commit/3a7f359653df8c77c1714d04beea283ae1f08d19).
Коммиты `d7bb994`, `d1fa0cc` локально отсутствуют; GitHub для них вернул422.
`art/warrior-review-v1/model.ts` отсутствует и в HEAD, и в GitHub (404).
Локальных исходных `source-before.zip` для replay нет. Найденные архивы Mage
Blink/Fireball относятся к другому арту и не заменяют Warrior/replay источники.
Оригинальные pixel-survivor/game-base не читались и не изменялись.
Commit, push и deployment не выполнялись.

## Что исправлено и как сохраняется строгость assertions

1. **12 устаревших runtime-проверок** сверены с существующим английским каталогом:
   Twilight/Dying/Burning Grove, Briar Beast, Guardian notices, Frost Nova/Armageddon,
   значения upgrade cards и Berserk. Проверка Haste теперь строго сравнивает также
   поле `multiplier: 1.5`, которое уже возвращает текущий BuffSystem. Числа, таймеры,
   damage, pause/resume, reset, RNG и остальные assertions сохранены.
2. `integrationProof()` читает **реальный** JSON при первом обращении к полю.
   Ранее один отсутствующий Warrior proof срывал импорт22 независимых тестовых
   файлов. Теперь их проверки кадров/аудио/таймингов запускаются; обращение к
   отсутствующему proof по-прежнему выбрасывает ENOENT. Отдельный negative test
   подтверждает отсутствие fallback, пустых fake proofs или выдуманных hashes.
3. `runtimePath()`, `readRuntimeFile()` и `historicalWalk()` разрешают только имена
   перенесённых файлов. Они **не изменяют ни один байт или hash**. Проверка полного
   старого inventory по `DEPENDENCY_MAP_BEFORE.json` и всех175 public-файлов (174
   ассета + старый favicon) проходит. В historical view не входят Laravel website
   assets и новый `game/assets.ts`; любой другой новый игровой файл попадает в
   inventory и ломает строгую проверку. Это адаптация путей, не ослабление hash-check.
4. Добавлены текущие проверки **348 кадров** Warrior (127 hero, 156 skills + два
   crack, 63 ultimate): каждый packed RGBA hash совпадает с **существующим**
   принятым runtime manifest. Подлинное source→atlas соответствие для утраченных
   исходников это не доказывает и исторический тест не заменяет.
5. Пять структурных replay текущего баланса сравнивают две реальные симуляции с
   одинаковым seed и проверяют отличие другого seed. Старые golden fixtures и
   `earlyReplay` не менялись. Эта проверка повторяемости не доказывает совместимость
   со старым коммитом или выживаемость персонажа.
6. Устранено реальное окруженческое предупреждение standalone DEV: Vite сканировал
   архивный `meteor-viewer-before.html` и не находил его `viewer.mjs`. Теперь
   `optimizeDeps.entries=['index.html']` применяется только к standalone mode.
   Это не исключение тестов/типов/исходников из валидации. DEV E2E повторён без
   ошибки dependency scan.
7. Добавлена read-only диагностика MySQL, которая не печатает credentials и всегда
   использует только guarded database `pixel_survivor_test` на loopback.

Тесты не отключены, не помечены skip/todo и не исключены из tsconfig/Vitest.
Не добавлялись `any`, `ts-ignore`, фиктивные declaration-модули или mock review.
Существующие принятые PNG/WAV/JSON/provenance записи не переписывались.

## Сравнение Vitest до и после QA

| Показатель | До QA / предыдущий отчёт | После QA |
| --- | ---: | ---: |
| Тестовых файлов | 161 | 164 |
| Файлов с ошибками | 35 | 29 |
| Зарегистрировано тестов | 1090 | 1185 |
| Passed | 1066 | 1147 |
| Failed assertions | 24 | 38 |
| Ошибок загрузки модуля | 23 | 1 |
| Skip/todo | 0 | 0 |

Рост failed assertions **не скрывается**: исправлены12 исходных ожиданий, но после
устранения общей ошибки импорта впервые исполнились84 ранее не собиравшихся теста:
58 проходят,26 обнаруживают недостающие исторические proofs/старые scope.
Ещё11 новых QA-тестов проходят. Формула: старые24 − исправленные12 + новые
выявленные26 =38. Все38 остались красными, плюс один модуль с ошибкой загрузки.
Полный набор не зелёный; сравнивать только прежнее число24 без collection errors
было бы неверно.

Полные машинные результаты и логи: `qa/qa-vitest-before.json`,
`qa/qa-vitest-final.json`, соответствующие `.log`; классификация — `QA_FAILURES.json`.
Исходные `GAME_BASELINE.log`, `GAME_AFTER.log`, `VALIDATION.json` и dependency map
сохранены без изменений, это историческая запись задачи переноса.

## Все 47 исходных проблем

В таблице каждая из23 ошибок загрузки модуля и каждый из24 упавших assertions.
MODULE COLLECTION означает, что assertions данного файла ранее вообще не запускались.

| ID | Файл / проверка | Первопричина | Источник истины | Статус |
| --- | --- | --- | --- | --- |
| I01 | `tests/unit/ambient-music-review.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I02 | `tests/unit/ash-warden-library.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I03 | `tests/unit/ash-warden-north-meteor-review.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I04 | `tests/unit/ash-warden-pixellab-runtime.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I05 | `tests/unit/ash-warden-sounds.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I06 | `tests/unit/astral-flame-review.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I07 | `tests/unit/astral-projectile-review.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I08 | `tests/unit/berserk-sprint-scope.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I09 | `tests/unit/biome-phase-notice.test.ts` — announces dusk exactly at its milestone for five run seconds | Устаревшее ожидание текущего runtime | game/config/atmosphere.ts | FIXED: актуальный контракт подтверждён, assertion проходит |
| I10 | `tests/unit/biome-phase-notice.test.ts` — announces dying exactly at its milestone for five run seconds | Устаревшее ожидание текущего runtime | game/config/atmosphere.ts | FIXED: актуальный контракт подтверждён, assertion проходит |
| I11 | `tests/unit/biome-phase-notice.test.ts` — announces burning exactly at its milestone for five run seconds | Устаревшее ожидание текущего runtime | game/config/atmosphere.ts | FIXED: актуальный контракт подтверждён, assertion проходит |
| I12 | `tests/unit/boss-meteor-ui-fix.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I13 | `tests/unit/briar-practice.test.ts` — starts one real Briar Beast with the same lawful Mage54 build, HP and ready lightning ultimate | Устаревшее ожидание текущего runtime | game/config/enemyDefinitions.ts | FIXED: актуальный контракт подтверждён, assertion проходит |
| I14 | `tests/unit/endgame.test.ts` — preserves original ordinary/boss replay before15 from0 without Guardian side effects | Исторический replay: причина несовпадения не установлена | tests/fixtures/pre-*-replay.json; source d7bb994/d1fa0cc (недоступен) | UNRESOLVED: исторический assertion сохранён |
| I15 | `tests/unit/endgame.test.ts` — preserves original ordinary/boss replay before15 from180 without Guardian side effects | Исторический replay: причина несовпадения не установлена | tests/fixtures/pre-*-replay.json; source d7bb994/d1fa0cc (недоступен) | UNRESOLVED: исторический assertion сохранён |
| I16 | `tests/unit/endgame.test.ts` — preserves original ordinary/boss replay before15 from480 without Guardian side effects | Исторический replay: причина несовпадения не установлена | tests/fixtures/pre-*-replay.json; source d7bb994/d1fa0cc (недоступен) | UNRESOLVED: исторический assertion сохранён |
| I17 | `tests/unit/endgame.test.ts` — preserves original ordinary/boss replay before15 from870 without Guardian side effects | Исторический replay: причина несовпадения не установлена | tests/fixtures/pre-*-replay.json; source d7bb994/d1fa0cc (недоступен) | UNRESOLVED: исторический assertion сохранён |
| I18 | `tests/unit/endgame.test.ts` — creates active early Guardians with individual linear snapshots and radar/notice | Устаревшее ожидание текущего runtime | game/systems/RareGuardianSystem.ts | FIXED: актуальный контракт подтверждён, assertion проходит |
| I19 | `tests/unit/fire-ultimate-runtime.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I20 | `tests/unit/frost-armageddon.test.ts` — freezes root/sequence on pause, clears casts and control on death/disposal and retains upgrade identity | Устаревшее ожидание текущего runtime | game/abilities/definitions.ts; game/systems/UpgradeSystem.ts | FIXED: актуальный контракт подтверждён, assertion проходит |
| I21 | `tests/unit/frost-ultimate-runtime.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I22 | `tests/unit/guardian-encounter.test.ts` — activates on creation without damage/proximity and keeps one awakening deadline | Устаревшее ожидание текущего runtime | game/systems/RareGuardianSystem.ts | FIXED: актуальный контракт подтверждён, assertion проходит |
| I23 | `tests/unit/loot.test.ts` — temporary stats and XP refreshes without stacking, combines different buffs and derives upgraded stats | Устаревшее ожидание текущего runtime | game/loot/BuffSystem.ts; game/loot/types.ts | FIXED: актуальный контракт подтверждён, assertion проходит |
| I24 | `tests/unit/mage-meteor-v3.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I25 | `tests/unit/mage-sfx.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I26 | `tests/unit/mage-uploaded-sounds.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I27 | `tests/unit/miniboss-assets-audio.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I28 | `tests/unit/music-runtime.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I29 | `tests/unit/survival-enrage.test.ts` — preserves original pre10:00 AI, spawn, combat snapshot and RNG from0 s | Историческая проверка: требуется подлинный source/proof | tests/fixtures/pre-*-replay.json; source d7bb994/d1fa0cc (недоступен) | UNRESOLVED: исторический assertion сохранён |
| I30 | `tests/unit/survival-enrage.test.ts` — preserves original pre10:00 AI, spawn, combat snapshot and RNG from180 s | Историческая проверка: требуется подлинный source/proof | tests/fixtures/pre-*-replay.json; source d7bb994/d1fa0cc (недоступен) | UNRESOLVED: исторический assertion сохранён |
| I31 | `tests/unit/survival-enrage.test.ts` — preserves original pre10:00 AI, spawn, combat snapshot and RNG from480 s | Историческая проверка: требуется подлинный source/proof | tests/fixtures/pre-*-replay.json; source d7bb994/d1fa0cc (недоступен) | UNRESOLVED: исторический assertion сохранён |
| I32 | `tests/unit/survival-enrage.test.ts` — preserves original pre10:00 AI, spawn, combat snapshot and RNG from570 s | Историческая проверка: требуется подлинный source/proof | tests/fixtures/pre-*-replay.json; source d7bb994/d1fa0cc (недоступен) | UNRESOLVED: исторический assertion сохранён |
| I33 | `tests/unit/upgrade-cards.test.ts` — reads ranked control/meteor and Blink bonuses from existing balance data without changing World | Устаревшее ожидание текущего runtime | game/ui/upgradeCards.ts; game/config/mobilityUpgrades.ts | FIXED: актуальный контракт подтверждён, assertion проходит |
| I34 | `tests/unit/upgrade-cards.test.ts` — shows the Berserk rank1 sprint bonus and refresh rule in the upgrade card | Устаревшее ожидание текущего runtime | game/ui/upgradeCards.ts; game/config/mobilityUpgrades.ts | FIXED: актуальный контракт подтверждён, assertion проходит |
| I35 | `tests/unit/upgrade-cards.test.ts` — shows the Berserk rank2 sprint bonus and refresh rule in the upgrade card | Устаревшее ожидание текущего runtime | game/ui/upgradeCards.ts; game/config/mobilityUpgrades.ts | FIXED: актуальный контракт подтверждён, assertion проходит |
| I36 | `tests/unit/upgrade-cards.test.ts` — shows the Berserk rank3 sprint bonus and refresh rule in the upgrade card | Устаревшее ожидание текущего runtime | game/ui/upgradeCards.ts; game/config/mobilityUpgrades.ts | FIXED: актуальный контракт подтверждён, assertion проходит |
| I37 | `tests/unit/visual-cleanup-rune-idle.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I38 | `tests/unit/warrior-buffs-v4.test.ts` — protects the explicit change scope and reuses the accepted Banner A object byte for byte | Отсутствует исторический source/proof | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | UNRESOLVED: исторический assertion сохранён |
| I39 | `tests/unit/warrior-combat-scope.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I40 | `tests/unit/warrior-empty-hand.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I41 | `tests/unit/warrior-hero-scope.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I42 | `tests/unit/warrior-review.test.ts` — MODULE COLLECTION | Отсутствующий файл | art/warrior-review-v1/model + catalog (недоступны) | BLOCKED: review modules отсутствуют |
| I43 | `tests/unit/warrior-skills.test.ts` — verifies exact accepted RGBA, all production atlas frames and the explicit limited runtime scope | Отсутствует исторический source/proof | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | UNRESOLVED: исторический assertion сохранён |
| I44 | `tests/unit/warrior-sounds.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I45 | `tests/unit/warrior-spear-release.test.ts` — limits the timing fix to one config file and preserves the remaining 467 runtime files | Отсутствует исторический source/proof | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | UNRESOLVED: исторический assertion сохранён |
| I46 | `tests/unit/warrior-ultimates-accepted.test.ts` — MODULE COLLECTION | Отсутствующий файл | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | Сборка модуля восстановлена; отдельные архивные assertions остаются красными |
| I47 | `tests/unit/warrior-ultimates-assets.test.ts` — preserves all selected Warrior ultimate RGBA frames and the explicit runtime scope | Отсутствует исторический source/proof | Подлинные stage manifests/baselines/proofs + полная цепочка later acceptances; текущие manifests в game/art и game/audio | UNRESOLVED: исторический assertion сохранён |

## Все оставшиеся падения

Это38 failed assertions и одна ошибка загрузки модуля. Падения inventory/hash не
объявляются багами текущей игры без подлинного старого состояния. Тесты остаются
строгими и красными; подтверждённых ошибок текущей игровой/финансовой логики в
выполненных сценариях не обнаружено.

| ID | Файл / проверка | Класс | Фактическая ошибка |
| --- | --- | --- | --- |
| R01 | `tests/unit/ambient-music-review.test.ts` — preserves the review proof and allows only the later explicit music integration | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-hero-runtime-v1\integration-verification.json' |
| R02 | `tests/unit/ash-warden-library.test.ts` — catalogues all51 main clips,15 assembled scenes,4 actual projections and labelled unused/reference assets | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-buffs-v4\integration-verification.json' |
| R03 | `tests/unit/ash-warden-library.test.ts` — leaves all345 runtime files unchanged after accepted Eclipse flame integration | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-hero-runtime-v1\integration-verification.json' |
| R04 | `tests/unit/ash-warden-north-meteor-review.test.ts` — keeps the complete runtime inventory and all345 game files intact pending acceptance | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-hero-runtime-v1\integration-verification.json' |
| R05 | `tests/unit/ash-warden-pixellab-runtime.test.ts` — packs all60 accepted native RGBA cels losslessly, with2px padding and bounded atlas memory | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-buffs-v4\integration-verification.json' |
| R06 | `tests/unit/ash-warden-sounds.test.ts` — limits runtime changes to the explicit user-authorized sound integration | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-hero-runtime-v1\integration-verification.json' |
| R07 | `tests/unit/astral-flame-review.test.ts` — leaves all341 runtime files and inventory unchanged after the approved projectile/Blink integration | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-hero-runtime-v1\integration-verification.json' |
| R08 | `tests/unit/astral-projectile-review.test.ts` — retains the initial preview proof and verifies the subsequently approved narrow integration scope | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-hero-runtime-v1\integration-verification.json' |
| R09 | `tests/unit/berserk-sprint-scope.test.ts` — limits the Berserk sprint change to four runtime files and preserves all other runtime bytes | Несовместимая историческая область файлов/байтов | AssertionError: expected [ …(478) ] to deeply equal [ …(468) ] |
| R10 | `tests/unit/boss-meteor-ui-fix.test.ts` — changes exactly four presentation files and preserves all359 other runtime files and all audio/atlas assets | Историческая проверка: требуется подлинный source/proof | AssertionError: src/game/art/FinalBossArt.ts: expected '5b8cd70cd2e1b8950b0d135bbc0e174413df8…' to be '472c8096833d52363892295e9a7463b6c769d…' // Object.is equality |
| R11 | `tests/unit/endgame.test.ts` — preserves original ordinary/boss replay before15 from0 without Guardian side effects | Исторический replay: причина несовпадения не установлена | AssertionError: expected '65daa6ddf0772ef548722f71bff81aaca067b…' to be 'fc4e7d1fc3d20f2c737a0cbd5313a641d7d14…' // Object.is equality |
| R12 | `tests/unit/endgame.test.ts` — preserves original ordinary/boss replay before15 from180 without Guardian side effects | Исторический replay: причина несовпадения не установлена | AssertionError: expected '00af386c24ed4d758b836014cba395101c086…' to be '8cfcbbbbdf4797b8878fdac9f316d75b45419…' // Object.is equality |
| R13 | `tests/unit/endgame.test.ts` — preserves original ordinary/boss replay before15 from480 without Guardian side effects | Исторический replay: причина несовпадения не установлена | AssertionError: expected 'afbf8b3e8a5872e84ed89af9efce76f61f5b7…' to be '62209e9e0fd562f9f900ad4acbd3ee521e0ce…' // Object.is equality |
| R14 | `tests/unit/endgame.test.ts` — preserves original ordinary/boss replay before15 from870 without Guardian side effects | Исторический replay: причина несовпадения не установлена | AssertionError: expected '7d2c9a41db371fe87cb153b2e129a5dc2fccb…' to be 'd612a59ad06b2469a8b217421763243322c56…' // Object.is equality |
| R15 | `tests/unit/fire-ultimate-runtime.test.ts` — limits the accepted integration to9 changed and8 added runtime files and protects every other file | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-buffs-v4\integration-verification.json' |
| R16 | `tests/unit/frost-ultimate-runtime.test.ts` — preserves all389 unrelated runtime files including fire gameplay/audio and frost combat | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-buffs-v4\integration-verification.json' |
| R17 | `tests/unit/mage-meteor-v3.test.ts` — audits approved PixelLab pixels, unchanged boss/archive art, padding and black light compositing | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-buffs-v4\integration-verification.json' |
| R18 | `tests/unit/mage-sfx.test.ts` — allows only the explicitly requested audio and practice changes over the accepted art baseline | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-buffs-v4\integration-verification.json' |
| R19 | `tests/unit/mage-uploaded-sounds.test.ts` — preserves music, gameplay and all other runtime files outside the exact4changed/6added scope | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-hero-runtime-v1\integration-verification.json' |
| R20 | `tests/unit/mage-uploaded-sounds.test.ts` — replaces Arcane Shield with the quiet user WAV and leaves every other runtime file unchanged | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-buffs-v4\integration-verification.json' |
| R21 | `tests/unit/mage-uploaded-sounds.test.ts` — connects the supplied Frost Nova WAV and preserves every other runtime file | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-hero-runtime-v1\integration-verification.json' |
| R22 | `tests/unit/miniboss-assets-audio.test.ts` — changes only the five presentation files and eleven explicitly accepted local assets/modules | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-hero-runtime-v1\integration-verification.json' |
| R23 | `tests/unit/music-runtime.test.ts` — limits runtime changes to audio and selected MP3 assets over the363-file baseline | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-buffs-v4\integration-verification.json' |
| R24 | `tests/unit/survival-enrage.test.ts` — preserves original pre10:00 AI, spawn, combat snapshot and RNG from0 s | Историческая проверка: требуется подлинный source/proof | AssertionError: expected '65daa6ddf0772ef548722f71bff81aaca067b…' to be 'fc4e7d1fc3d20f2c737a0cbd5313a641d7d14…' // Object.is equality |
| R25 | `tests/unit/survival-enrage.test.ts` — preserves original pre10:00 AI, spawn, combat snapshot and RNG from180 s | Историческая проверка: требуется подлинный source/proof | AssertionError: expected '00af386c24ed4d758b836014cba395101c086…' to be '8cfcbbbbdf4797b8878fdac9f316d75b45419…' // Object.is equality |
| R26 | `tests/unit/survival-enrage.test.ts` — preserves original pre10:00 AI, spawn, combat snapshot and RNG from480 s | Историческая проверка: требуется подлинный source/proof | AssertionError: expected '948495edfc21aae434633bec448a7190d12cc…' to be '28c689d108bc954033cf5215dca3af3a4903e…' // Object.is equality |
| R27 | `tests/unit/survival-enrage.test.ts` — preserves original pre10:00 AI, spawn, combat snapshot and RNG from570 s | Историческая проверка: требуется подлинный source/proof | AssertionError: expected 'af617a3c693ee3cd2fa9cab12a47a280ee11c…' to be 'e4e774dcab1c34a179cf5d65917da790231ac…' // Object.is equality |
| R28 | `tests/unit/visual-cleanup-rune-idle.test.ts` — keeps all411 runtime files, adds four ambience files and changes only the six accepted presentation files | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-hero-runtime-v1\integration-verification.json' |
| R29 | `tests/unit/warrior-buffs-v4.test.ts` — protects the explicit change scope and reuses the accepted Banner A object byte for byte | Отсутствует исторический source/proof | Error: Command failed: C:\Program Files\nodejs\node.exe scripts/verify-warrior-buffs-v4.mjs |
| R30 | `tests/unit/warrior-combat-scope.test.ts` — changes only the seven authored presentation files and adds one legacy charge atlas page | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-combat-sync-runtime-v2\runtime-baseline.json' |
| R31 | `tests/unit/warrior-empty-hand.test.ts` — changes exactly five approved runtime files and preserves all other 463 hashes | Несовместимая историческая область файлов/байтов | AssertionError: expected [ …(478) ] to deeply equal [ …(468) ] |
| R32 | `tests/unit/warrior-empty-hand.test.ts` — uses all selected empty hand edits, preserves every windup and keeps timing, routes and exclusions | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-spear-empty-hand-review-v1\manifest.json' |
| R33 | `tests/unit/warrior-hero-scope.test.ts` — limits Warrior integration to seven presentation/selection files, three modules and ten atlas files | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\generated\warrior-hero-runtime-v1\runtime-baseline.json' |
| R34 | `tests/unit/warrior-review.test.ts` — MODULE COLLECTION | Отсутствуют исторические модули | Cannot find module '../../art/warrior-review-v1/model' imported from <repository>/tests/unit/warrior-review.test.ts |
| R35 | `tests/unit/warrior-skills.test.ts` — verifies exact accepted RGBA, all production atlas frames and the explicit limited runtime scope | Отсутствует исторический source/proof | Error: Command failed: C:\Program Files\nodejs\node.exe scripts/verify-warrior-cleave-v3.mjs |
| R36 | `tests/unit/warrior-sounds.test.ts` — preserves all nine user recordings and pins the complete integration inventory and hashes | Отсутствует исторический source/proof | Error: ENOENT: no such file or directory, open '<repository>\art\warrior\sounds\banner.wav' |
| R37 | `tests/unit/warrior-spear-release.test.ts` — limits the timing fix to one config file and preserves the remaining 467 runtime files | Несовместимая историческая область файлов/байтов | AssertionError: expected [ Array(72) ] to deeply equal [ 'game/config/warriorAbilities.ts' ] |
| R38 | `tests/unit/warrior-ultimates-accepted.test.ts` — limits accepted-ultimate integration to ten explicit runtime files and preserves the remaining 449 | Несовместимая историческая область файлов/байтов | AssertionError: expected [ …(478) ] to deeply equal [ …(468) ] |
| R39 | `tests/unit/warrior-ultimates-assets.test.ts` — preserves all selected Warrior ultimate RGBA frames and the explicit runtime scope | Отсутствует исторический source/proof | Error: Command failed: C:\Program Files\nodejs\node.exe scripts/verify-warrior-ultimates-v1.mjs |

## Что отсутствует и как это влияет на runtime

Полная цепочка later acceptances требует следующих отсутствующих файлов:

- `art/generated/warrior-buffs-v4/integration-verification.json`
- `art/generated/warrior-cleave-sync-v3/integration-verification.json`
- `art/generated/warrior-skills-runtime-v1/integration-verification.json`
- `art/generated/warrior-combat-sync-runtime-v2/integration-verification.json`
- `art/generated/warrior-hero-runtime-v1/integration-verification.json`

В этих же пяти каталогах отсутствуют соответствующие `runtime-baseline.json`.
Не восстановлены также:

- `art/warrior-review-v1/model` и `catalog`: нет реального кода `createReviewWorld`,
  `reviewHit`, `DIRECTIONS`, `SKILLS`. Они нужны только архивному review, не `/play`.
- `art/generated/warrior-concept-pack-v1/source/png.mjs`: оригинальный utility,
  импортируемый историческими verifiers; каталог концептов/Banner A тоже отсутствует.
  Текущие PNG проверены другим уже существовавшим RGBA decoder из tests/helpers.
- `art/generated/warrior-movement-attacks-review-v5/manifest.json` и source PNG;
  `warrior-skills-directions-review-v5/raw/*`, `warrior-animation-review-v1/raw/*`:
  подлинные source frames, на которые ссылаются текущие accepted manifests.
- `art/generated/warrior-spear-empty-hand-review-v1/manifest.json` и выбранные edits.
- Девять исходных WAV из `art/warrior/sounds/`: banner, charge, cleave, shield_block,
  spear_throw, spear_ultimate, stomp, ultimate_stomp, whirlwind. Runtime WAV на месте
  и защищены хэшами; нельзя утверждать сравнение с утраченным исходным WAV.
- Подлинные World/source-before для `d7bb994` и `d1fa0cc`. Восемь golden replay
  остаются несовпадающими. Причина не доказана: нельзя без источника исключить
  историческое изменение поведения, сериализации, текста или расширение snapshot.

Старый inventory в468 файлов относится к более раннему состоянию. Уже до переноса
в импорте было478 файлов. Дополнительные10 файлов не выдуманы QA; это реальные
файлы из before-map/Initial import:

- `src/game/abilities/baseDamage.ts`
- `src/game/art/warriorMovingLegs.json`
- `src/game/platform/ItemUseOperation.ts`
- `src/game/platform/PaidActionOperation.ts`
- `src/game/platform/port.ts`
- `src/game/platform/premium.ts`
- `src/game/platform/progression.ts`
- `src/game/platform/runItems.ts`
- `src/ui/components/InGameInventory.vue`
- `src/ui/components/PremiumActions.vue`

Они объясняют размер inventory, но не позволяют автоматически переписать старые
byte proofs. Например, исходный spear-scope теперь находит72 отличия, а не одно;
для их исторической атрибуции нужна полная подлинная история. Current source
сохранён QA побайтово; hashes не перезаписывались ради зелёного результата.

Наличие рабочих принятых атласов, существующих pixelSHA256 и успешного `/play`
подтверждает текущую поставку. Это не заменяет художественную приёмку утраченными
исходниками. Эти два вида доказательств намеренно не смешаны.

## Полный TypeScript: все ошибки

Runtime TypeScript проходит. Полный `npm run typecheck` выполнен и сохраняет10
ошибок **только в одном архивном файле**. Первые две — отсутствующие реальные
модули; остальные восемь следуют из потерянных типов. Runtime-ошибок и новых
ошибок QA helper/config не найдено. Имитировать типы утраченного review было бы
непроверенным восстановлением, поэтому fake `.d.ts`, any и исключения не добавлены.

| Расположение | Код | Диагностика |
| --- | --- | --- |
| `tests/unit/warrior-review.test.ts:2:46` | TS2307 | Cannot find module '../../art/warrior-review-v1/model' or its corresponding type declarations. |
| `tests/unit/warrior-review.test.ts:3:36` | TS2307 | Cannot find module '../../art/warrior-review-v1/catalog' or its corresponding type declarations. |
| `tests/unit/warrior-review.test.ts:9:26` | TS7006 | Parameter 'e' implicitly has an 'any' type. |
| `tests/unit/warrior-review.test.ts:10:46` | TS7006 | Parameter 'a' implicitly has an 'any' type. |
| `tests/unit/warrior-review.test.ts:10:69` | TS7006 | Parameter 'a' implicitly has an 'any' type. |
| `tests/unit/warrior-review.test.ts:13:30` | TS7006 | Parameter 'p' implicitly has an 'any' type. |
| `tests/unit/warrior-review.test.ts:21:58` | TS18046 | 'a' is of type 'unknown'. |
| `tests/unit/warrior-review.test.ts:22:48` | TS7006 | Parameter 'a' implicitly has an 'any' type. |
| `tests/unit/warrior-review.test.ts:22:71` | TS7006 | Parameter 'a' implicitly has an 'any' type. |
| `tests/unit/warrior-review.test.ts:23:73` | TS7006 | Parameter 'a' implicitly has an 'any' type. |

Машинная таблица: `QA_TYPESCRIPT_ERRORS.json`. Неизвестные зависимости нужны для
исправления этих10 ошибок; полный typecheck не объявлен успешным.

## MySQL: факты, guard и команды для пользователя

- Windows service `MySQL80` — Running; TCP127.0.0.1:3306 отвечает.
- `phpunit.mysql.xml` задаёт testing/mysql/loopback/`pixel_survivor_test`, очищает
  DB_URL и включает существующий test-provider guard. Credentials не hardcoded.
- `MySqlTestDatabase::assertSafe()` до миграций проверяет environment, driver,
  host, имя БД, отсутствие URL и результат `SELECT DATABASE()`.
- `TestPaymentGuard` отдельно требует test mode, разрешённый host и ровно эту БД.
- Поддерживаемые credentials: DB_USERNAME/DB_PASSWORD в текущем process environment
  либо приватном `.env.testing`, игнорируемом Git. В существующем локальном `.env`
  MySQL credentials не заданы; ни значения других secrets, ни passwords не выводились.
- `php vendor/bin/phpunit -c phpunit.mysql.xml` остановился с16 infrastructure
  errors на guard: credentials1045. До миграций/тестовых writes дело не дошло.
  Существование целевой БД **не установлено**, поскольку authentication отвергнута.
- `php scripts/check-mysql-test-connection.php` подтвердил1045 и `writes:0`.
  После этой диагностики доступ не восстановлен; успешного MySQL результата нет.

Настройка только с **уже существующим** аккаунтом для отдельной тестовой БД,
без создания пользователей/смены паролей. В PowerShell из корня, с PHP8.4.1+ в PATH:

```powershell
$qaOldUser = $env:DB_USERNAME
$qaOldPassword = $env:DB_PASSWORD
$qaMysqlCredential = Get-Credential -Message 'Existing account for isolated pixel_survivor_test'
try {
    $env:DB_USERNAME = $qaMysqlCredential.UserName
    $env:DB_PASSWORD = $qaMysqlCredential.GetNetworkCredential().Password
    php scripts/check-mysql-test-connection.php
    if ($LASTEXITCODE -ne 0) { throw 'Isolated MySQL connection is not ready; no migrations were run.' }
    composer test:mysql
} finally {
    if ($null -eq $qaOldUser) { Remove-Item Env:DB_USERNAME -ErrorAction SilentlyContinue }
    else { $env:DB_USERNAME = $qaOldUser }
    if ($null -eq $qaOldPassword) { Remove-Item Env:DB_PASSWORD -ErrorAction SilentlyContinue }
    else { $env:DB_PASSWORD = $qaOldPassword }
    $qaMysqlCredential = $null
    $qaOldPassword = $null
}
```

Для нестандартного локального порта задайте DB_PORT приватно; host/database/URL
ограничены guard. Не меняйте target на dev/production и не запускайте migrate:fresh
вручную. Если диагностика даст1049, отдельная БД ещё не подготовлена: нужно её
отдельное предоставление пользователем, без самостоятельного создания аккаунтов
или изменения основной базы. Credentials не нужно присылать в чат или писать
литералом в историю команд/Git.

## Повторные регрессии и evidence

| Проверка | Результат |
| --- | --- |
| Laravel SQLite | PASS16/16,383 assertions; in-memory DB |
| Guarded MySQL | BLOCKED1045 до миграций,16 infrastructure errors |
| PHPStan | PASS0 errors |
| Pint | PASS |
| Runtime TypeScript | PASS |
| Full TypeScript | BLOCKED10 diagnostics, один архивный файл |
| ESLint | PASS |
| Full Vitest | NOT GREEN:135 passed files/29 failed files;1147 passed/38 failed assertions; одна collection error |
| Catalog verification | PASS; генерируемый каталог не изменился |
| Client production build | PASS через npm run build:ssr |
| SSR build + live rendering | PASS; реальный SSR HTML проверен browser smoke |
| Standalone build | PASS; предупреждение большого chunk остаётся |
| Browser smoke | PASS3/3 |
| Game DEV E2E | PASS2/2 после optimizer fix |
| Current Warrior packed pixel hashes | PASS348 кадров, существующие manifests |
| Current seeded determinism | PASS5 стартовых времён |
| Missing proof negative check + real JSON + inventory | PASS3/3 |

Логи соответствуют командам `qa/qa-*.log`; полный результат — `QA_VALIDATION.json`.
Backend smoke повторно проверил session auth/verified,25 `/internal` routes,
отсутствие `/api/v1`, CSRF419 и обязательность токена даже при same-origin metadata,
foreign ownership, pending credits, payment idempotency/signatures/replay, wallet
ledger, purchases, inventory consumption/ack, premium reroll/recovery/ack,
resurrection и run start/finish. Filament/operator gates сохранены.

Browser smoke прошёл вход, кабинет и навигацию, магазин, локальный payment sandbox,
локальную симуляцию provider verification, `/play`, игровые inventory requests,
Filament и mobile landscape. Game DEV E2E прошёл движение, XP/upgrade, contact damage,
смерть/restart без роста listeners, gamepad через mock browser API при реальном
контроллере игры, Warden и декодированное аудио. Это не тест физического gamepad,
телефона, реального Stripe, production deploy или длительного soak.

Canvas screenshots `screenshots/laravel-first/boss-gamepad.png` и
`mobile-landscape.png` заново просмотрены: sprite/HUD/terrain читаемы, Canvas
рендерится. Остальные smoke screenshots: home, shop, payment-confirmed, filament,
account-game, guest-game, combat-upgrade. Временные серверы после проверки остановлены.

## Изменения файлов QA

Ниже изменения относительно recovery checkpoint, а не весь незакоммиченный перенос.
Плюс созданы этот отчёт, QA_FAILURES/QA_TYPESCRIPT_ERRORS/QA_VALIDATION и evidence
в `docs/architecture/qa/`; обновлены статусы README/основного отчёта/PROGRESS/DECISIONS/BLOCKERS.

- `tests/helpers/approvedWardenIntegration.ts`
- `tests/helpers/runtimePath.ts`
- `tests/unit/ambient-music-review.test.ts`
- `tests/unit/ash-warden-library.test.ts`
- `tests/unit/ash-warden-north-meteor-review.test.ts`
- `tests/unit/ash-warden-pixellab-runtime.test.ts`
- `tests/unit/ash-warden-sounds.test.ts`
- `tests/unit/astral-flame-review.test.ts`
- `tests/unit/astral-projectile-review.test.ts`
- `tests/unit/berserk-sprint-scope.test.ts`
- `tests/unit/biome-phase-notice.test.ts`
- `tests/unit/boss-meteor-ui-fix.test.ts`
- `tests/unit/briar-practice.test.ts`
- `tests/unit/endgame.test.ts`
- `tests/unit/fire-ultimate-runtime.test.ts`
- `tests/unit/frost-armageddon.test.ts`
- `tests/unit/frost-ultimate-runtime.test.ts`
- `tests/unit/guardian-encounter.test.ts`
- `tests/unit/loot.test.ts`
- `tests/unit/mage-meteor-v3.test.ts`
- `tests/unit/mage-sfx.test.ts`
- `tests/unit/mage-uploaded-sounds.test.ts`
- `tests/unit/miniboss-assets-audio.test.ts`
- `tests/unit/music-runtime.test.ts`
- `tests/unit/upgrade-cards.test.ts`
- `tests/unit/visual-cleanup-rune-idle.test.ts`
- `tests/unit/warrior-combat-scope.test.ts`
- `tests/unit/warrior-empty-hand.test.ts`
- `tests/unit/warrior-hero-scope.test.ts`
- `tests/unit/warrior-sounds.test.ts`
- `tests/unit/warrior-spear-release.test.ts`
- `tests/unit/warrior-ultimates-accepted.test.ts`
- `vite.config.ts`
- `scripts/check-mysql-test-connection.php`
- `scripts/runtime-paths.mjs`
- `scripts/runtime-paths.d.mts`
- `tests/helpers/integrationProof.ts`
- `tests/helpers/runtimeFile.ts`
- `tests/unit/current-runtime-determinism.test.ts`
- `tests/unit/current-warrior-assets.test.ts`
- `tests/unit/integration-proof.test.ts`

## Оставшиеся условия приёмки

1. Получить подлинные review source/proofs и полный chronological source для старых
   byte/inventory/replay assertions. Затем проверить их без переписывания hashes.
2. Восстановить настоящие review modules и добиться зелёного полного TypeScript.
3. Предоставить приватный доступ к отдельной MySQL test DB и повторить guarded suite.
4. Повторить полный набор; до этого не ставить done marker и не объявлять
   production-ready. Все ограничения выше остаются видимыми в автоматических проверках.
