<?php

namespace App\Services;

use App\Models\GameRun;
use App\Runs\GameCatalog;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UpgradePool
{
    /** @param array<string,mixed> $input
     * @return array<string,mixed>
     */
    public function context(GameRun $run, array $input): array
    {
        $rules = app(GameCatalog::class)->forRun($run);
        $hero = $rules['heroes'][$run->character_id];
        $catalog = $rules['upgrades'];
        $maximum = $rules['maxLevel'];
        $v = Validator::make($input, ['level' => 'required|integer:strict|between:2,'.$maximum, 'hero_level' => 'required|integer:strict|between:2,'.$maximum,
            'elapsed' => 'required|numeric|between:0,86400', 'upgrades' => 'present|array|max:100', 'upgrades.*' => 'integer:strict|between:1,1000',
            'ultimate' => ['present', 'nullable', Rule::in($hero['ultimates'])],
            'choices' => 'prohibited', 'pool' => 'prohibited', 'price' => 'prohibited', 'user_id' => 'prohibited'])->validate();
        abort_unless($v['hero_level'] >= $v['level'] && array_sum($v['upgrades']) + ($v['ultimate'] ? 1 : 0) === $v['level'] - 2, 422, 'Upgrade build does not match the reported level.');
        $entries = array_column($catalog['entries'], null, 'id');
        $mobility = [];
        foreach ($v['upgrades'] as $id => $rank) {
            $entry = $entries[$id] ?? null;
            abort_unless($entry && $this->matches($entry, $hero) && $rank <= $entry['max'], 422, 'Invalid upgrade in reported build.');
            if ($entry['rule'] === 'mobility') {
                $mobility[] = $id;
            }
            if ($ability = $entry['ability']) {
                $start = $hero['starting'][$ability] ?? 0;
                $rank = $this->rank($hero, $ability, $v['upgrades']);
                $skill = $rules['skills'][$ability];
                abort_if($entry['rule'] === 'unlock' && $start > 0, 422, 'A starting ability cannot be unlocked again.');
                abort_unless(($start || isset($v['upgrades']['unlock-'.$ability])) && $rank <= $skill['maxRank'] && ($entry['rule'] !== 'evolve' || $rank >= $skill['evolutionRank']), 422, 'Invalid ability rank in reported build.');
            }
        }
        abort_unless(count($mobility) <= 1 && (! $mobility || $v['level'] > $catalog['mobilityLevel']), 422, 'Invalid mobility specialization.');
        abort_unless(! $v['ultimate'] || $v['level'] > $catalog['ultimateLevel'] && $v['elapsed'] >= $catalog['ultimateTime'], 422, 'Ultimate is unavailable.');
        ksort($v['upgrades']);
        $v['elapsed'] = round((float) $v['elapsed'], 3);

        return $v;
    }

    /** @param array<string,mixed> $context
     * @return list<string>
     */
    public function eligible(GameRun $run, array $context): array
    {
        $rules = app(GameCatalog::class)->forRun($run);
        $hero = $rules['heroes'][$run->character_id];
        $catalog = $rules['upgrades'];
        if (! $context['ultimate'] && $context['level'] >= $catalog['ultimateLevel'] && $context['elapsed'] >= $catalog['ultimateTime']) {
            return array_values(array_map(fn ($id) => 'ultimate-'.$id, $hero['ultimates']));
        }
        $upgrades = $context['upgrades'];
        $mobility = array_values(array_filter(array_keys($upgrades), fn ($id) => is_string($id) && str_starts_with($id, 'mobility-')));
        $result = $supplies = [];
        foreach ($catalog['entries'] as $entry) {
            $id = $entry['id'];
            if (! $this->matches($entry, $hero) || ($upgrades[$id] ?? 0) >= $entry['max']) {
                continue;
            }
            $ability = $entry['ability'];
            $level = $ability ? $this->rank($hero, $ability, $upgrades) : 0;
            $skill = $ability ? $rules['skills'][$ability] : null;
            $eligible = match ($entry['rule']) {
                'unlock' => $level === 0, 'rank' => $level > 0 && $level < $skill['maxRank'], 'evolve' => $level >= $skill['evolutionRank'],
                'mobility' => $context['hero_level'] >= $catalog['mobilityLevel'] && (! $mobility || $mobility[0] === $id),
                default => true,
            };
            if ($eligible) {
                if ($entry['rule'] === 'supply') {
                    $supplies[] = $id;
                } else {
                    $result[] = $id;
                }
            }
        }
        if (! $mobility && $context['level'] >= $catalog['mobilityLevel']) {
            return array_values(array_filter($result, fn ($id) => str_starts_with($id, 'mobility-')));
        }

        return count($result) >= 3 ? $result : [...$result, ...$supplies];
    }

    /** @param array<string,mixed> $entry
     * @param  array<string,mixed>  $hero
     */
    private function matches(array $entry, array $hero): bool
    {
        return (! $entry['archetype'] || $entry['archetype'] === $hero['combat'])
            && (! $entry['ability'] || in_array($entry['ability'], $hero['skills'], true));
    }

    /** @param array<string,mixed> $hero
     * @param  array<string,int>  $upgrades
     */
    private function rank(array $hero, string $ability, array $upgrades): int
    {
        return ($hero['starting'][$ability] ?? 0) + ($upgrades['unlock-'.$ability] ?? 0) + ($upgrades['rank-'.$ability] ?? 0);
    }

    /** @param list<string> $pool
     * @param  list<string>  $previous
     * @return list<string>
     */
    public function choose(array $pool, array $previous = []): array
    {
        $fresh = array_values(array_diff($pool, $previous));
        $old = array_values(array_intersect($pool, $previous));
        $result = [];
        foreach ([$fresh, $old] as $group) {
            while (count($result) < 3 && $group) {
                $index = random_int(0, count($group) - 1);
                $result[] = array_splice($group, $index, 1)[0];
            }
        }

        return $result;
    }
}
