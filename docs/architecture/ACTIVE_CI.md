# Active QA / CI — Laravel Game Template

2026-11-18. Только `Novarg93/laravel-game-template`; commit/push/deploy в этой задаче не выполнялись.

## Граница наборов

| Набор | Содержимое | Команда |
| --- | --- | --- |
| Активный Laravel | SQLite integration, авторизация, CSRF, ownership, Ledger/Wallet, pending Tokens, inventory, idempotency, premium actions, resurrection, runs, Filament | `php artisan test` |
| Активный frontend/game | 143 файла, **1046 тестов**, включая движение, столкновения/урон, upgrades, enemies, bosses, результаты, gamepad, HttpPlatform, текущие атласы и seeded determinism | `npm run test:runtime` / `npm test` |
| Активный TypeScript | Весь `game/`, `resources/js/`, активные unit/browser/E2E/helpers и конфигурации; strict, noUnusedLocals, noUnusedParameters | `npm run typecheck` |
| Browser smoke | 3 production Laravel/SSR сценария, 2 standalone DEV, 1 standalone production | `test:browser`, `test:e2e`, `test:e2e:production` |
| Исторический Vitest | 62 исходных файла; **414 тестов**, 376 passed / 38 failed и одна collection error; 29 failing files | `npm run test:historical` |
| Исторический TypeScript | Настоящие зависимости архивных тестов, включая отсутствующие review-модули: **10 diagnostics** | `npm run typecheck:historical` |
| Исторический browser acceptance | 148 исходных PixelSurvivor review/UI-сценариев, прежние selectors, screenshots/recipes и proof dependencies; в этой задаче не запускались | `test:e2e:historical`, `test:e2e:historical:production` |

Архив находится в [tests/historical](../../tests/historical/README.md). Смешанные файлы
сохранены **целиком**, а их актуальные тесты извлечены в `tests/unit/`. Поэтому 275
runtime-кейсов намеренно встречаются в обоих Vitest-наборах: 1046 + 414 − 275 = все
1185 ранее собиравшихся кейсов. Из 164 исходных unit-файлов 102 остаются целиком
активными, 41 разделён, 21 целиком исторический. Никаких skip/todo, замены golden
hashes, `any`, `ts-ignore` или ослабления исходных assertions не добавлено.

[manifest.json](../../tests/historical/manifest.json) содержит все причины классификации,
исходные/архивные SHA-256 и хэши statements. 216 архивных файлов: 62 unit, 148 E2E,
3 helpers и 3 golden fixtures. Относительные module specifiers адаптированы к месту
архива; остальные statements сверены с checkpoint. JSON fixtures сохранены побайтово.
`npm run test:suites` проверяет архивные хэши, strict-конфигурацию и охват всех
активных TS-файлов. Исторические команды сохраняют ненулевой exit при ошибках.
Перед публикацией добавлено `tests/historical/** -text` в `.gitattributes`:
Git сохраняет исходные bytes, включая CRLF в 145 файлах, при checkout на любой ОС.
Проверяется также соответствие архивных blobs будущего коммита manifest-хэшам.

## Что исправлено при финализации

| Исходная проблема | Результат |
| --- | --- |
| Актуальные проверки зависели от отсутствующих художественных источников | Разделены по реальным зависимостям, включая чтение путей из manifests. Чистая копия обнаружила ещё 17 локально проходящих source-проверок; их оригиналы также сохранены в архиве |
| Общий TypeScript падал на `art/warrior-review-v1/model` и `catalog` | Полный check всего актуального кода и активных тестов проходит; 10 исторических диагностик доступны отдельно, без поддельных declarations |
| Ручной SSR мешал воспроизводимости browser smoke | Runner сам запускает собранный SSR и PHP, проверяет health, отказывается занимать чужие порты и завершает свои процессы |
| Подготовка browser fixtures могла завершиться с PHP exit 0 после исключения | Добавлена проверка успешного завершения fixtures; сохранён исходный guard каталога `restructure-*`, создаётся только новая изолированная SQLite |
| Новый production smoke требовал Node ESM JSON import attributes | Добавлен настоящий `with { type: 'json' }`; проверяются текущие shipped atlas hashes и restart без DEV harness |
| Fresh checkout не имел generated Wayfinder types | `pretypecheck` явно вызывает `types:generate` |
| Не было общего обязательного CI | Добавлен [Active CI workflow](../../.github/workflows/active-ci.yml), без `continue-on-error` для активных проверок |
| MySQL 1045 | Диагностика повторена: MySQL80 Running, `pixel_survivor_test`, 1045, **writes: 0**. Credentials/users/существующие базы не менялись |

Приложение, баланс, финансовые механизмы, API payloads и assets не менялись. Из 934
контролируемых application/runtime/asset-файлов отличается только whitespace в
`routes/web.php`: Pint удалил лишние пустые строки из уже существовавшего рабочего
изменения. PHP token stream совпадает с checkpoint; существующая перестановка
маршрутов сохранена. Оба dependency lockfile не менялись. Recovery:
`.tmp/active-ci-start/source.zip` + manifest; приватные `.env` и БД туда не включались.

## Восемь replay: совместимость не доказана

Оригинальные `d7bb994`, `d1fa0cc` и `source-before.zip` отсутствуют. Старый replay
adapter и все полные golden hashes сохранены. Ниже первые 12 символов, наблюдаемые
в реальном архивном прогоне; **каждая строка остаётся mismatch / compatibility unproven**.

| Golden fixture / source | start, s | Expected prefix | Observed prefix |
| --- | ---: | --- | --- |
| pre-enrage / d7bb994 | 0 | `fc4e7d1fc3d2` | `65daa6ddf077` |
| pre-enrage / d7bb994 | 180 | `8cfcbbbbdf47` | `00af386c24ed` |
| pre-enrage / d7bb994 | 480 | `28c689d108bc` | `948495edfc21` |
| pre-enrage / d7bb994 | 570 | `e4e774dcab1c` | `af617a3c693e` |
| pre-phase2-ordinary / d1fa0cc | 0 | `fc4e7d1fc3d2` | `65daa6ddf077` |
| pre-phase2-ordinary / d1fa0cc | 180 | `8cfcbbbbdf47` | `00af386c24ed` |
| pre-phase2-ordinary / d1fa0cc | 480 | `62209e9e0fd5` | `afbf8b3e8a58` |
| pre-phase2-ordinary / d1fa0cc | 870 | `d612a59ad06b` | `7d2c9a41db37` |

Актуальные same-seed replay проверяют повторяемость текущего World и не доказывают
совместимость со старой симуляцией. Полный список остальных исторических ошибок
и недостающих proof/review/source-файлов сохранён в
[QA_STABILIZATION.md](QA_STABILIZATION.md); новые пути — `tests/historical/unit/`.
В частности, не восстановлены Warrior review model/catalog, отсутствующие Warrior
integration proofs и источники, необходимые source→atlas / старым byte-scope checks.
Новых изображений, анимаций или эталонных доказательств не создавалось.

## Воспроизведение и CI

**Финальный общий прогон `composer ci:check` в чистой копии завершился с exit 0**,
2026-11-18 15:46:20–15:48:20 UTC. Реально выполнены:

| Проверка | Результат |
| --- | --- |
| Laravel SQLite | PASS — 16 tests / 383 assertions |
| PHPStan / Pint / ESLint | PASS, PHPStan 0 errors |
| Full active TypeScript / runtime-only TypeScript | PASS |
| Runtime Vitest | PASS — 143 files / 1046 tests, 0 skip/todo |
| Archive integrity / upgrade catalog | PASS |
| Client / SSR / standalone builds | PASS |
| Production Laravel + SSR browser | PASS — 3/3 |
| Standalone DEV / production browser | PASS — 2/2 + 1/1 |
| Historical Vitest / TypeScript | Прежние 38 failing tests + collection error / 10 diagnostics |
| MySQL diagnostic | BLOCKED 1045, writes: 0 |

Workflow запускается на PR, push в main и manual dispatch. Actions закреплены полными
SHA, toolchain — PHP 8.4.27, Composer 2.10.3, Node 22.16.0. `composer install` и
`npm ci` используют существующие lockfiles; Playwright устанавливает свой Chromium.
После установки зависимостей и браузера общий локальный вход — `composer ci:check`.
Он выполняет PHP checks и `npm run check` с TypeScript, lint, runtime Vitest, catalog,
всеми сборками и browser smoke. Артефакты CI ограничены screenshots/test-results;
`.env`, storage и databases не публикуются. Branch protection удалённо не менялась:
после публикации workflow status check называется `Laravel, frontend, game and browser`.

## Warden Practice в standalone E2E

В [запуске 44360648091](https://github.com/Novarg93/laravel-game-template/actions/runs/44360648091)
Chromium на Ubuntu открыл Warden Practice. Пятисекундное ожидание `phase1`
истекло на `intro`. Снимок отказа показывал `AWAKENING` и таймер `20:00`.
Диалог паузы отсутствовал.

В диагностике на Ubuntu 24.04 (WSL2, Chromium 153.0.8010.0) к планированию
кадров только во время интро добавлялась задержка 150 мс. При исходном
таймауте `World` был в `playing`, вкладка оставалась видимой и в фокусе,
стик и кнопка паузы были отпущены, рывок завершён. Отрисовывалась анимация
`spawn`, возраст `ritualEnter` составлял 0,55 секунды. Игра штатно
дошла до `phase1` через 12,8 секунды реального времени. `World.step`
учитывает не более 50 мс симуляции за кадр, а интро требует 2,3 секунды
симуляции. Пятисекундная проверка зависела от частоты кадров Chromium.

Исправление в `tests/e2e/laravel-first-game.spec.ts` переводит этот сценарий
на часы Playwright. Тест держит кнопки геймпада до подтверждённых `playing`
и `paused`, проверяет остановку симуляции на паузе и явный возврат в `menu`.
После запуска практики он прогоняет штатные кадры Phaser в управляемом времени,
проверяет рост возраста `ritualEnter`, затем `phase1` в симуляции и на HUD.
Проверки HP и аудио сохранены, добавлена проверка видимых слоёв босса.
Общий 30-секундный таймаут сценария, длительность интро, игровой цикл и параметры
пресетов сохранены.

Для повторной проверки выполните
`npm run test:e2e -- -g "real Warden practice" --repeat-each=3`.
Исправленный сценарий прошёл 3 из 3 повторов на Ubuntu 24.04 (Chromium 153)
и 2 из 2 на Windows (закреплённый Chromium 156). Скриншот первой фазы
создаётся в `screenshots/laravel-first/boss-gamepad.png`.
Полный локальный `composer ci:check` на Windows завершился с кодом 0.
Прошли 33 Laravel-теста, 1069 Vitest-тестов и 13 браузерных сценариев.
Отдельная проверка всех десяти контрольных хешей Game Content System v2 прошла.

Проверки выполнялись в `.tmp/active-ci-clean/`: исходники и тесты скопированы без
`art/`, исторических `docs/`, private env, старых `.tmp/`, `node_modules/` и `vendor/`.
Пакеты установлены заново. На Windows portable PHP потребовалась локальная копия
уже доверенных public Windows CA; TLS verification не отключалась. Для одного
заблокированного GitHub API dist скачан официальный exact-commit codeload ZIP,
проверены CRC и совпадение PHPStan PHAR с locked installed package, затем выполнен
`composer install` из проверенного кэша без сети. Системные настройки не менялись.

Логи и screenshots находятся в `.tmp/clean-*` и
`.tmp/active-ci-clean/screenshots/laravel-first/`. Desktop и mobile Canvas просмотрены.
Машинные результаты: [active-ci-validation.json](qa/active-ci-validation.json).
GitHub Actions ещё не запускался: commit/push этой задачи запрещены. Активный
набор отделён от исторической приёмки; без MySQL verification и подлинных исторических
источников безусловная production-ready / historical-compatibility декларация не делается.
