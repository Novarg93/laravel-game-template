<?php

namespace App\Support;

use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;

final class ProjectPresentation
{
    public function name(bool $defaults = false): string
    {
        return $this->text($defaults ? config('project.name') : (config('project.environment.name') ?? config('project.name')), 'name');
    }

    /** @return array{id: string, stylesheet: string, adminPrimary: string} */
    public function theme(bool $defaults = false): array
    {
        $id = $this->slug(($defaults ? null : config('project.environment.theme')) ?? config('project.theme'), 'theme');
        $theme = config("project.themes.{$id}");
        if (! is_array($theme)) {
            throw new InvalidArgumentException("Unknown project theme: {$id}.");
        }
        $stylesheet = $this->asset($theme['stylesheet'] ?? null, 'theme.stylesheet', required: true, stylesheet: true);

        return ['id' => $id, 'stylesheet' => (string) $stylesheet, 'adminPrimary' => $this->color($theme['adminPrimary'] ?? null, 'theme.adminPrimary')];
    }

    /** @return array{title: string, subtitle: string, description: string, tagline: string, logo: ?string, favicon: ?string, theme: string, accent: ?string} */
    public function game(bool $defaults = false, bool $strict = false): array
    {
        $theme = $this->slug(($defaults ? null : config('project.environment.gameTheme')) ?? config('project.game.theme'), 'game.theme');
        if (! in_array($theme, ['classic', 'aurora'], true)) {
            throw new InvalidArgumentException("Unknown game menu theme: {$theme}.");
        }
        $accent = config('project.game.accent');

        return [
            'title' => $this->text(($defaults ? null : config('project.environment.gameTitle')) ?? config('project.game.title') ?? $this->name($defaults), 'game.title'),
            'subtitle' => $this->text(config('project.game.subtitle'), 'game.subtitle'),
            'description' => $this->text(config('project.game.description'), 'game.description'),
            'tagline' => $this->text(config('project.tagline'), 'tagline'),
            'logo' => $this->asset(config('project.game.logo'), 'game.logo', $strict),
            'favicon' => $this->asset(config('project.game.favicon'), 'game.favicon', $strict),
            'theme' => $theme,
            'accent' => $accent === null ? null : $this->color($accent, 'game.accent'),
        ];
    }

    /** @return array<string, mixed> */
    public function website(bool $strict = false): array
    {
        $game = $this->game(strict: $strict);
        $favicon = $this->asset(config('project.favicon'), 'favicon', $strict);
        $legacyFavicon = $this->asset(config('project.legacyFavicon'), 'legacyFavicon', $strict);
        $email = config('project.supportEmail');
        if ($email !== null && (! is_string($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL))) {
            throw new InvalidArgumentException('Project supportEmail must be a public email address.');
        }
        $logo = $this->asset(config('project.headerLogo'), 'headerLogo', $strict);

        return [
            'id' => $this->slug(config('project.id'), 'id'),
            'name' => $this->name(),
            'brand' => $this->text(config('project.brand') ?? $this->name(), 'brand'),
            'tagline' => $game['tagline'],
            'description' => $this->text(config('project.description'), 'description'),
            'headerLogo' => $logo,
            'footerLogo' => $this->asset(config('project.footerLogo'), 'footerLogo', $strict) ?? $logo,
            'favicon' => $favicon ?? $legacyFavicon,
            'legacyFavicon' => $legacyFavicon,
            'touchIcon' => $this->asset(config('project.touchIcon'), 'touchIcon', $strict),
            'socialImage' => $this->asset(config('project.socialImage'), 'socialImage', $strict),
            'supportEmail' => $email,
            'legalOperator' => config('project.legalOperator') === null ? null : $this->text(config('project.legalOperator'), 'legalOperator'),
            'theme' => $this->theme()['id'],
            'game' => $game,
            'homepage' => $this->homepage($game['title']),
        ];
    }

    /** @return array{name: string, logo: ?string, primary: string} */
    public function admin(bool $strict = false): array
    {
        return [
            'name' => $this->text(config('project.admin.name') ?? $this->name().' · Treasury', 'admin.name'),
            'logo' => $this->asset(config('project.admin.logo'), 'admin.logo', $strict),
            'primary' => $this->color(config('project.admin.primary') ?? $this->theme()['adminPrimary'], 'admin.primary'),
        ];
    }

    public function favicon(): ?string
    {
        return $this->asset(config('project.favicon'), 'favicon')
            ?? $this->asset(config('project.legacyFavicon'), 'legacyFavicon');
    }

    /** @return array<string, mixed> */
    private function homepage(string $gameTitle): array
    {
        $input = config('project.homepage');
        if (! is_array($input)) {
            throw new InvalidArgumentException('Project homepage must be an array.');
        }
        $input['title'] ??= $gameTitle;
        $text = 'required|string|max:1200';
        $list = 'required|array|list|min:1|max:12';
        // Explicit key lists at every object boundary prevent exposure of extra config.
        $rules = [
            'home' => 'required|array:title,pageTitle,overline,tagline,description,playLabel,heroesLabel,registerLabel,platformNote,stats,capture,features,heroes,expedition,progression,footerNote',
            'home.title' => 'required|string|max:100',
            'home.pageTitle' => $text, 'home.overline' => $text, 'home.tagline' => $list,
            'home.tagline.*' => $text, 'home.description' => $text, 'home.playLabel' => $text,
            'home.heroesLabel' => $text, 'home.registerLabel' => $text, 'home.platformNote' => $text,
            'home.stats' => $list, 'home.stats.*' => 'array:value,label',
            'home.stats.*.value' => $text, 'home.stats.*.label' => $text,
            'home.capture' => 'required|array:image,alt,location,label,caption,captionDetail',
            'home.capture.image' => $text, 'home.capture.alt' => $text, 'home.capture.location' => $text,
            'home.capture.label' => $text, 'home.capture.caption' => $text, 'home.capture.captionDetail' => $text,
            'home.features' => $list, 'home.features.*' => $text,
            'home.heroes' => 'required|array:overline,title,description,mage,warrior',
            'home.heroes.overline' => $text, 'home.heroes.title' => $text,
            'home.heroes.description' => $list, 'home.heroes.description.*' => $text,
            'home.expedition' => 'required|array:overline,title,emphasis,description,linkLabel,image,alt,caption',
            'home.expedition.overline' => $text, 'home.expedition.title' => $list,
            'home.expedition.title.*' => $text, 'home.expedition.emphasis' => $text,
            'home.expedition.description' => $text, 'home.expedition.linkLabel' => $text,
            'home.expedition.image' => $text, 'home.expedition.alt' => $text, 'home.expedition.caption' => $text,
            'home.progression' => 'required|array:overline,title,cards,note',
            'home.progression.overline' => $text, 'home.progression.title' => $text,
            'home.progression.cards' => $list, 'home.progression.cards.*' => 'array:label,title,description',
            'home.progression.cards.*.label' => $text, 'home.progression.cards.*.title' => $text,
            'home.progression.cards.*.description' => $text, 'home.progression.note' => $text,
            'home.footerNote' => $text,
        ];
        foreach (['mage', 'warrior'] as $hero) {
            $key = "home.heroes.{$hero}";
            $rules[$key] = 'required|array:title,description,traits';
            $rules[$key.'.title'] = $list;
            $rules[$key.'.title.*'] = $text;
            $rules[$key.'.description'] = $text;
            $rules[$key.'.traits'] = $list;
            $rules[$key.'.traits.*'] = $text;
        }
        $data = Validator::make(['home' => $input], $rules);
        if ($data->fails()) {
            throw new InvalidArgumentException('Invalid project homepage fields: '.implode(', ', $data->errors()->keys()).'.');
        }
        $home = $data->validated()['home'];
        $this->asset($home['capture']['image'], 'homepage.capture.image', required: true);
        $this->asset($home['expedition']['image'], 'homepage.expedition.image', required: true);

        return $home;
    }

    private function text(mixed $value, string $field): string
    {
        if (! is_string($value) || trim($value) === '' || mb_strlen($value) > 600 || preg_match('/[\x00-\x1f\x7f]/', $value)) {
            throw new InvalidArgumentException("Invalid project {$field} text.");
        }

        return trim($value);
    }

    private function slug(mixed $value, string $field): string
    {
        if (! is_string($value) || ! preg_match('/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/', $value) || strlen($value) > 64) {
            throw new InvalidArgumentException("Invalid project {$field} slug.");
        }

        return $value;
    }

    private function color(mixed $value, string $field): string
    {
        if (! is_string($value) || ! preg_match('/\A#[a-f0-9]{6}\z/i', $value)) {
            throw new InvalidArgumentException("Project {$field} must be a six-digit hex color.");
        }

        return $value;
    }

    private function asset(mixed $value, string $field, bool $strict = false, bool $required = false, bool $stylesheet = false): ?string
    {
        if ($value === null && ! $required) {
            return null;
        }
        $pattern = $stylesheet
            ? '~\A/project-theme/[a-z0-9-]+\.css\z~'
            : '~\A/(?:((?:branding|images)/)(?:[a-z0-9_-]+/)*[a-z0-9_-]+\.(?:svg|png|ico|webp|jpe?g|avif)|favicon\.(?:svg|ico)|apple-touch-icon\.png)\z~i';
        if (! is_string($value) || ! preg_match($pattern, $value)) {
            throw new InvalidArgumentException("Invalid public asset path for project {$field}.");
        }
        $path = realpath(public_path(ltrim($value, '/')));
        $root = realpath(public_path());
        $directory = explode('/', $value)[1];
        $allowed = str_contains(ltrim($value, '/'), '/') ? $root.DIRECTORY_SEPARATOR.$directory : $root;
        if ($path !== false && (! str_starts_with($path, $allowed.DIRECTORY_SEPARATOR) || ! is_file($path))) {
            throw new InvalidArgumentException("Asset for project {$field} escapes its public directory or is not a file.");
        }
        if ($path === false && ($strict || $required)) {
            throw new InvalidArgumentException("Missing public asset for project {$field}: {$value}.");
        }

        return $path === false ? null : $value;
    }
}
