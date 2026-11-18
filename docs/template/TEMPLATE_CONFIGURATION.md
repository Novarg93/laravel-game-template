# Конфигурация Laravel Game Template

## Что относится к брендингу

| Категория | Где обнаружена | Как настраивается |
| --- | --- | --- |
| Идентичность и оформление | `SiteLayout.vue`, используемый `AuthLayout.vue`, `app.ts`, Blade-входы, `AdminPanelProvider.php`, ошибки, локальный test checkout, глобальный sender | `config/project.php`, `SiteBrand.vue`, общие Blade partials и CSS tokens. `MAIL_FROM_NAME` остаётся явной настройкой отправителя |
| Маркетинг | `Welcome.vue` (герой страницы, подписи, CTA, преимущества, персонажи, раздел прохождения и прогрессия), подпись footer, игровое меню | `homepage`, `tagline`, `description`, `game` в конфиге. Текст читает существующая разметка |
| Содержание игры | `Guide.vue`, `MainMenu.vue`, `game/abilities`, `game/config`, `game/systems` | Имена и свойства героев, карт, оружия, врагов, правила и результаты относятся к игровой реализации. Guide продолжает читать определения |
| История | `tests/historical/`, исходные QA-артефакты, provenance аудио и рисунков, имена кадров атласов, счета и записи прошлых операций | Существующие файлы и идентификаторы сохраняются. Invoice template и sandbox product label относятся к финансовым документам и контрактам |
| Операционные ID | `pixel-survivor-v1` в localStorage, SQL-имена из guard, `pixel-survivor/…/v1` во внутренних платёжных подписях, имена и версии каталогов, item IDs и route IDs | `project.id` — публичный slug. Он не переименовывает ни одно из этих значений |

`Play` и ошибки имеют серверный title, Inertia берёт название страницы из
`Head` и добавляет публичное имя проекта. Старое имя Cursed Chronicle в Guide
заменено названием игры. При аудите публичных сообщений проверены flash / inline
статусы сайта и игровые уведомления. Они описывают действия, ошибки и события
игры и продолжают использовать собственные тексты. Верификация и сброс пароля
используют существующие Laravel/Fortify уведомления. Для имени отправителя
действует `MAIL_FROM_NAME`, а при его отсутствии — публичное имя проекта.
Шаблон содержимого стандартных писем Laravel использует `APP_NAME` для
подписи и шапки. Для нового проекта согласуйте его с публичным именем.

Юридические страницы сохраняют текст и пометку о черновике. Необязательные
`legalOperator` и `supportEmail` добавляют предоставленные владельцем реквизиты.
Contact сохраняет сообщения через существующую форму. Публичный email, если
указан, отображается дополнительно. Перед публикацией владелец утверждает
юридические тексты отдельно.

## Поля и путь данных

| Поле в `config/project.php` | Назначение |
| --- | --- |
| `id`, `name`, `brand`, `tagline`, `description` | Slug, имя приложения, короткое имя для header/footer, слоган, описание и метаданные. Если `brand` равен `null`, используется имя проекта |
| `headerLogo`, `footerLogo` | Логотипы сайта. Footer наследует header. Если файла нет, используется текстовый wordmark и существующий знак |
| `favicon`, `legacyFavicon`, `touchIcon`, `socialImage` | Основная и резервная иконки, иконка Apple, изображение Open Graph. Чтобы убрать старые иконки, задайте `null` в дополнительных полях |
| `theme`, `themes` | ID темы, CSS-файл и первичный цвет Filament для каждой темы |
| `supportEmail`, `legalOperator` | Опциональные публичные контакты и оператор. Значения по умолчанию отсутствуют |
| `homepage` | Заголовок, слоган, CTA, пояснения, capture, stats, features, карточки публичных героев, expedition, progression и footer. Ключи героев в v1 соответствуют двум существующим героям |
| `game` | Заголовок, подзаголовок, описание, изображение логотипа, favicon, токен акцента и тема игрового меню. Заголовок по умолчанию берётся из имени проекта |
| `admin` | Название, логотип и первичный цвет панели. Значения `null` дают имя «Project · Treasury», текстовый логотип и первичный цвет выбранной темы |

Порядок выбора публичного имени Laravel — `PROJECT_NAME`, `APP_NAME`,
`VITE_APP_NAME`, затем `project.name`. Если при копировании шаблона настраиваете
имя в PHP, согласуйте его с существующим `APP_NAME` или задайте `PROJECT_NAME`
явно. `APP_NAME` сохраняет свою обычную роль в Laravel, в том числе в
идентификаторах, которые зависят от `config('app.name')`. Для переименования
публичной витрины на существующем инстансе используйте `PROJECT_NAME`.
`PROJECT_THEME`, `PROJECT_GAME_TITLE` и `PROJECT_GAME_THEME` переопределяют
соответствующие поля Laravel. `VITE_APP_NAME` остаётся последним клиентским
резервом до получения Inertia props. Не помещайте секреты в переменные `VITE_*`.

`App\Support\ProjectPresentation` формирует DTO из явно перечисленных полей.
Inertia отправляет его в `props.project`, включая частичные обновления страниц.
`useProject()` возвращает реактивный объект из типизированных props. Blade и
Inertia SSR используют одно серверное значение. Blade передаёт только игровую
часть DTO отдельному входу `/play` в экранированном HTML-атрибуте. Компоненты
не выполняют дополнительных запросов. Серверные ключи, настройки провайдеров
и весь массив `config('project')` не сериализуются в эти props.

Пути к изображениям начинаются с `/branding/` или `/images/` и соответствуют
файлам под `public/`. Поддерживаются SVG, PNG, ICO, WebP, JPEG и AVIF. Также
разрешены существующие корневые `/favicon.svg`, `/favicon.ico`,
`/apple-touch-icon.png`. Используйте доверенные изображения проекта. Внешние
URL, query, traversal, приватные директории и symlink за границы разрешённой
директории отклоняются. Заданный, но отсутствующий необязательный логотип может
временно отобразиться как текст, однако проверка проекта сообщит об ошибке.
Изображения двух существующих маркетинговых секций обязательны.

## Темы сайта, панели и игры

`public/project-theme/pixel-survivor.css` содержит базовые значения. Для примера
`aurora.css` переопределяет их в конце цепочки. Чтобы добавить тему, создайте CSS
файл под `public/project-theme/`, добавьте slug со stylesheet и
`adminPrimary` в `themes`, затем выберите его. `site.css` связывает токены с UI
сайта и Tailwind-переменными. Совместимые CSS hooks панели и публичные
`brandName`, `brandLogo`, `favicon` и `colors` используются в Filament 5.
[Документация Filament 5 о настройке панели](https://filamentphp.com/docs/5.x/panel-configuration).

| Токены | Что контролируют |
| --- | --- |
| `--site-bg`, `--site-panel`, `--site-raised`, `--site-inset`, `--site-chrome` | Фон, панели, поднятая поверхность, поля, панели навигации |
| `--site-edge`, `--site-edge-bright`, `--site-radius` | Рамки, обводки полей, радиус панелей |
| `--site-text`, `--site-heading`, `--site-muted` | Основной, заголовочный и вторичный текст |
| `--site-accent`, `--site-secondary`, `--site-mint` | Основной акцент и акцент интерактивных элементов |
| `--site-danger`, `--site-destructive-bg`, `--site-success`, `--site-success-bg`, `--site-success-edge` | Ошибки и уведомления об успешных действиях |
| `--site-gold`, `--site-run-gold`, `--site-tokens` | Золотой декоративный акцент, Gold в кабинете и доступные Tokens |
| `--site-shadow`, `--site-solid-shadow`, `--site-header-shadow`, `--site-button-*` | Тени, цвета кнопки, её рамка и радиус |
| `--site-font-heading`, `--site-font-body` | Стек шрифтов сайта и заголовки панели |

Палитра сайтов не меняет Canvas, цвет эффектов, HUD или правила. Для игрового
меню `game.theme` принимает `classic` или `aurora`. `game.accent` принимает
цвет формата `#RRGGBB` для слова-акцента и надписи над ним. `game.logo` ставит
изображение на место wordmark, а его доступным названием остаётся `game.title`.
При `game.favicon: null` у `/play` используется иконка сайта, у standalone —
существующая `game/favicon.svg`. Игровые спрайты, аудио и атласы по-прежнему
загружаются из `public/game-assets/`.

## Standalone и проверка

```sh
php artisan project:sync                  # Создать game/presentation.generated.json из PHP-значений по умолчанию
php artisan project:sync --check          # Строгая проверка config и drift, без записи
php artisan project:sync --configured    # Явно собрать standalone с локальными PROJECT_*/APP_NAME overrides
npm run test:project                      # Проверить config, экспорт и согласованность игрового каталога
npm run dev:game                          # Запускается без PHP/Laravel после установки npm-зависимостей
npm run build:game
```

Для версии, распространяемой с исходниками, храните экспорт из PHP-значений по
умолчанию. Для локального самостоятельного билда с переменными окружения
используйте `--configured`; соответствующая проверка — `project:sync --configured --check`.
После локальной сборки верните канонический экспорт командой `project:sync`.
Standalone Vite читает один экспорт для HTML title, meta description и меню.
В standalone попадают только выбранные логотип/иконка и игровой asset pack.
За границами Vite или Laravel никакая динамическая загрузка конфигурации не нужна.

Пример для нового проекта в `config/project.php`:

```php
'id' => 'dawn-watch',
'name' => 'Dawn Watch',
'brand' => 'Dawn',
'tagline' => 'Hold the line until sunrise.',
'theme' => 'aurora',
'headerLogo' => '/branding/dawn-logo.svg',
'favicon' => '/branding/dawn-icon.png',
'legacyFavicon' => null,
'touchIcon' => null,
// Внутри game:
'title' => 'Dawn Watch',
'logo' => '/branding/dawn-logo.svg',
'favicon' => '/branding/dawn-icon.png',
'theme' => 'aurora',
'accent' => '#93b9ff',
```

Сначала положите реальные файлы в `public/branding/`. Сохраните остальные
обязательные поля массива, настройте CTA и текст `homepage`, затем запустите
`project:sync`. Используйте `PROJECT_NAME="Dawn Watch"`, если окружение всё ещё
задаёт старое имя Laravel.

## Игровой контент и пакеты оформления

`config/project.php` задаёт брендинг и темы. Герои, навыки, враги, карты,
волны и условия победы определяются пресетом в `game/content/`. Laravel
проверяет забеги по версии доверенного `resources/game/content-catalog.json`.
`npm run export:upgrades` синхронизирует версионированный каталог и
`upgrade-catalog.json`, который сохраняет контракт Pixel Survivor.
Проверку конфигурации, обоих каталогов и ассетов запускает `npm run test:project`.
[Game Content System](GAME_CONTENT_SYSTEM.md#синхронизация-и-версии)

Спрайты, эффекты, игровое окружение и звуки задаются пакетами в
`game/art/packs/`. Смена оформления сохраняет версию игровых правил.
[Asset Packs](ASSET_PACKS.md)

## Проверки и границы v1

Сценарий подготовки описан в [NEW_PROJECT_CHECKLIST.md](NEW_PROJECT_CHECKLIST.md).
Для локальной проверки альтернативной темы используйте
`npm run build:ssr` и `npm run test:browser:branding`. Runner переключает сайт
и меню только в своём процессном окружении и использует отдельную SQLite.
Сохраняйте штатную палитру Aurora для этого сценария. Для своей палитры
зарегистрируйте отдельный ID темы.

| Проверка | Локальный результат |
| --- | --- |
| Laravel SQLite | 28 тестов, 468 assertions |
| PHPStan, Pint, TypeScript, ESLint | Прошли |
| Активный Vitest | 1054 теста в 144 файлах |
| Проверка конфигурации, экспорта и каталога | Прошла |
| Client, SSR, standalone builds | Прошли |
| Chromium | 5 сценариев сайта, 2 Aurora, 2 standalone DEV, 1 standalone production |
| Отдельная альтернативная сборка standalone | 1 production smoke, включая пользовательский logo и favicon |
| Архив | SHA-256 всех 216 архивных файлов совпадают |

Скриншоты главной в desktop/mobile, Guide, входа, кабинета, Shop, Filament,
меню и HUD для обеих палитр находятся в `screenshots/project-branding/`.
Первый экран главной Pixel Survivor при 1280×720 совпал с архивом Active QA
с допуском 3 из 255 на канал RGB для каждого пикселя. Текст Guide и нижнее
маркетинговое примечание обновлены.
Standalone и mobile landscape сохранены в `screenshots/laravel-first/`.
Сборка альтернативного standalone проверена в отдельной копии внутри
`.tmp/project-branding-standalone/`. CI сохраняет стандартные скриншоты как
артефакты. Новый workflow проверен локально через `composer ci:check`.

Цвета специальных gameplay-панелей, эффекты, оформление финансовых PDF и
системные ошибки с повреждённой конфигурацией используют собственное оформление.
Маркетинговый текст остаётся ответственностью автора конфигурации.
Наличие текста в конфиге само по себе не включает провайдера или режим игры.
Исторические проверки и тесты MySQL остаются отдельными от Active CI.
