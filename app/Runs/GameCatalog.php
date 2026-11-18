<?php

namespace App\Runs;

use App\Models\GameRun;
use App\Support\CanonicalJson;
use LogicException;

final class GameCatalog
{
    public const LEGACY = 'pixel-survivor-v1';

    /** @var array{active: array<string,string>, versions: array<string,array<string,mixed>>}|null */
    private ?array $data = null;

    /** @return array{active: array<string,string>, versions: array<string,array<string,mixed>>} */
    public static function parse(string $json): array
    {
        $file = json_decode($json, true, 64, JSON_THROW_ON_ERROR);
        if (! is_array($file) || ($file['schema'] ?? null) !== 1 || ! is_array($file['active'] ?? null) || ! is_array($file['versions'] ?? null)) {
            throw new LogicException('Invalid game catalog schema.');
        }
        $versions = [];
        foreach ($file['versions'] as $row) {
            if (! is_array($row) || ! self::validRules($row)) {
                throw new LogicException('Invalid game content rules.');
            }
            $version = $row['version'] ?? null;
            $id = $row['id'] ?? null;
            if (! is_string($version) || ! is_string($id) || ! preg_match('/\A'.preg_quote($id, '/').'-v[1-9][0-9]*\z/', $version) || isset($versions[$version])) {
                throw new LogicException('Invalid or duplicate game content version.');
            }
            $versions[$version] = $row;
        }
        foreach ($file['active'] as $id => $version) {
            if (! is_string($id) || ! is_string($version) || ($versions[$version]['id'] ?? null) !== $id) {
                throw new LogicException('Active content references an inconsistent version.');
            }
        }
        if (! isset($versions[self::LEGACY])) {
            throw new LogicException('Historical Pixel Survivor rules are missing.');
        }

        return ['active' => $file['active'], 'versions' => $versions];
    }

    /** @param array<string,mixed> $row */
    private static function validRules(array $row): bool
    {
        return is_string($row['definitionHash'] ?? null) && preg_match('/\\A[a-f0-9]{64}\\z/', $row['definitionHash'])
            && is_bool($row['experimental'] ?? null) && is_bool($row['practice'] ?? null)
            && is_int($row['maxLevel'] ?? null) && $row['maxLevel'] > 0
            && is_int($row['scoreStep'] ?? null) && $row['scoreStep'] > 0
            && is_array($row['heroes'] ?? null) && $row['heroes'] !== []
            && is_array($row['skills'] ?? null) && $row['skills'] !== []
            && is_array($row['maps'] ?? null) && $row['maps'] !== []
            && is_array($row['enemies'] ?? null) && $row['enemies'] !== []
            && is_array($row['upgrades']['entries'] ?? null)
            && in_array($row['victory']['kind'] ?? null, ['duration', 'final-boss'], true)
            && is_numeric($row['victory']['at'] ?? null) && $row['victory']['at'] > 0;
    }

    /** @return array{active: array<string,string>, versions: array<string,array<string,mixed>>} */
    private function data(): array
    {
        if ($this->data === null) {
            $json = file_get_contents(resource_path('game/content-catalog.json'));
            if ($json === false) {
                throw new LogicException('Game content catalog is unavailable.');
            }
            $this->data = self::parse($json);
        }

        return $this->data;
    }

    /** @return array<string,mixed> */
    public function active(): array
    {
        $id = config('game-content.preset');
        $data = $this->data();
        $version = is_string($id) ? ($data['active'][$id] ?? null) : null;
        $row = $version !== null ? $data['versions'][$version] : null;
        if ($row === null || $row['experimental'] && ! app()->environment(['local', 'testing'])) {
            throw new LogicException('The configured game content preset is unavailable in this environment.');
        }

        return $row;
    }

    /** @return array<string,mixed> */
    public function forRun(GameRun $run): array
    {
        $version = $run->start_snapshot['content_version'] ?? self::LEGACY;
        $row = is_string($version) ? ($this->data()['versions'][$version] ?? null) : null;
        abort_if($row === null, 409, 'The run content version is unavailable.');
        if (array_key_exists('content_version', $run->start_snapshot)) {
            $hash = $run->start_snapshot['content_hash'] ?? null;
            abort_unless(is_string($hash) && hash_equals(CanonicalJson::hash($row), $hash), 409, 'The run content version has changed.');
        }

        return $row;
    }

    /** @return array<string,string> */
    public function publicHeroes(): array
    {
        $heroes = array_filter($this->active()['heroes'], fn (array $hero): bool => $hero['public']);

        return array_map(fn (array $hero): string => $hero['name'], $heroes);
    }
}
