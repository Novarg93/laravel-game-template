<?php

namespace Tests\Feature;

use App\Models\GameRun;
use App\Models\User;
use App\Runs\GameCatalog;
use App\Services\UpgradePool;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use LogicException;
use Tests\TestCase;

class GameContentTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string,string> */
    private function startInput(string $hero, string $map): array
    {
        return ['operation_id' => (string) Str::uuid(), 'client_run_id' => (string) Str::uuid(),
            'character_id' => $hero, 'biome_id' => $map, 'mode' => 'normal'];
    }

    /** @return array<string,mixed> */
    private function record(GameRun $run, bool $victory): array
    {
        $catalog = app(GameCatalog::class)->forRun($run);
        $kinds = array_fill_keys(array_keys($catalog['enemies']), 0);
        $enemy = $catalog['experimental'] ? 'bramble' : 'grunt';
        $kinds[$enemy] = 1;

        return ['id' => $run->client_run_id, 'outcome' => $victory ? 'victory' : 'defeat',
            'completionKind' => $victory ? 'survival' : 'defeat', 'elapsed' => $victory ? 20 : 2,
            'score' => $catalog['enemies'][$enemy]['score'], 'kills' => 1, 'level' => 1, 'finishedAt' => now()->toISOString(),
            'abilities' => array_keys($catalog['heroes'][$run->character_id]['starting']), 'byKind' => $kinds,
            'eliteByKind' => array_fill_keys(array_keys($kinds), 0),
            'finalEncounter' => ['reached' => false, 'killed' => false, 'duration' => 0],
            'details' => ['character' => $run->character_id, 'biome' => $run->biome_id, 'regularKills' => 1, 'eliteKills' => 0, 'bossKills' => 0, 'damage' => []],
        ];
    }

    public function test_version_is_chosen_by_the_server_and_remains_pinned_through_finish_and_retries(): void
    {
        $this->actingAs(User::factory()->create());
        $input = $this->startInput('scout', 'trial-grove');
        $this->postJson('/internal/runs', $input)->assertUnprocessable();
        config(['game-content.preset' => 'training-grove']);
        $this->postJson('/internal/runs', [...$input, 'content_version' => 'pixel-survivor-v1'])->assertUnprocessable();
        $this->postJson('/internal/runs', $this->startInput('mage', 'trial-grove'))->assertUnprocessable();
        $this->postJson('/internal/runs', $this->startInput('scout', 'grove'))->assertUnprocessable();
        $this->postJson('/internal/runs', [...$input, 'mode' => 'practice'])->assertUnprocessable();
        $start = $this->postJson('/internal/runs', $input)->assertOk()
            ->assertJsonPath('content_version', 'training-grove-v1')->assertJsonPath('economy.enabled', false)->json();
        $run = GameRun::findOrFail($start['server_run_id']);
        $url = '/internal/runs/'.$run->id.'/finish';
        $record = $this->record($run, true);
        $this->travel(21)->seconds();
        config(['game-content.preset' => 'pixel-survivor']);
        $this->postJson('/internal/runs', $input)->assertExactJson($start);
        $this->postJson($url, ['record' => [...$record, 'content_version' => 'pixel-survivor-v1']])->assertUnprocessable();
        $this->postJson($url, ['record' => [...$record, 'byKind' => [...$record['byKind'], 'forged_enemy' => 1]]])->assertUnprocessable();
        $this->postJson($url, ['record' => $record])->assertOk()->assertJsonPath('status', 'accepted')->assertJsonPath('character_xp', 0);
        $this->postJson($url, ['record' => $record])->assertOk()->assertJsonPath('status', 'accepted');
        $this->assertFalse($run->refresh()->ranking_eligible);
    }

    public function test_score_ability_pool_and_outcome_are_checked_against_training_rules(): void
    {
        config(['game-content.preset' => 'training-grove']);
        $this->actingAs(User::factory()->create());
        foreach (['valid_defeat', 'wrong_score', 'foreign_ability', 'missing_starter', 'early_victory'] as $case) {
            $id = $this->postJson('/internal/runs', $this->startInput('scout', 'trial-grove'))->assertOk()->json('server_run_id');
            $run = GameRun::findOrFail($id);
            $this->travel(21)->seconds();
            $record = $this->record($run, $case === 'early_victory');
            $record = match ($case) {
                'wrong_score' => [...$record, 'score' => 10],
                'foreign_ability' => [...$record, 'abilities' => ['trail-spark', 'lightning']],
                'missing_starter' => [...$record, 'abilities' => ['frost']],
                'early_victory' => [...$record, 'elapsed' => 19],
                default => $record,
            };
            $response = $this->postJson('/internal/runs/'.$id.'/finish', ['record' => $record]);
            if ($case === 'foreign_ability') {
                $response->assertUnprocessable();
            } else {
                $response->assertOk()->assertJsonPath('status', $case === 'valid_defeat' ? 'accepted' : 'pending_review');
            }
        }
    }

    public function test_legacy_snapshot_keeps_its_rules_and_historical_result_is_readable(): void
    {
        $this->actingAs(User::factory()->create());
        $id = $this->postJson('/internal/runs', $this->startInput('mage', 'grove'))->assertOk()->json('server_run_id');
        $run = GameRun::findOrFail($id);
        $snapshot = $run->start_snapshot;
        unset($snapshot['content_version'], $snapshot['content_hash']);
        $run->forceFill(['start_snapshot' => $snapshot])->save();
        config(['game-content.preset' => 'training-grove']);
        $this->assertSame(GameCatalog::LEGACY, app(GameCatalog::class)->forRun($run)['version']);
        $this->travel(3)->seconds();
        $this->postJson('/internal/runs/'.$id.'/finish', ['record' => $this->record($run, false)])
            ->assertOk()->assertJsonPath('status', 'accepted');
        $this->getJson('/internal/runs/'.$id.'/status')->assertOk();
    }

    public function test_upgrade_pool_uses_starting_abilities_and_rejects_ranks_above_the_catalog_cap(): void
    {
        config(['game-content.preset' => 'training-grove']);
        $this->actingAs(User::factory()->create());
        $id = $this->postJson('/internal/runs', $this->startInput('scout', 'trial-grove'))->assertOk()->json('server_run_id');
        $run = GameRun::findOrFail($id);
        $service = app(UpgradePool::class);
        $context = ['level' => 2, 'hero_level' => 2, 'elapsed' => 1, 'upgrades' => [], 'ultimate' => null];
        $pool = $service->eligible($run, $service->context($run, $context));
        $this->assertContains('rank-trail-spark', $pool);
        $this->assertNotContains('unlock-trail-spark', $pool);
        $this->assertNotContains('unlock-lightning', $pool);
        $context = [...$context, 'level' => 4, 'hero_level' => 4, 'upgrades' => ['rank-trail-spark' => 2]];
        $this->assertNotContains('rank-trail-spark', $service->eligible($run, $service->context($run, $context)));
        $this->expectException(ValidationException::class);
        $service->context($run, [...$context, 'level' => 9, 'hero_level' => 9]);
    }

    public function test_duplicate_exported_versions_are_invalid(): void
    {
        $document = json_decode((string) file_get_contents(resource_path('game/content-catalog.json')), true, 64, JSON_THROW_ON_ERROR);
        $document['versions'][] = $document['versions'][0];
        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('Invalid or duplicate game content version.');
        GameCatalog::parse(json_encode($document, JSON_THROW_ON_ERROR));
    }
}
