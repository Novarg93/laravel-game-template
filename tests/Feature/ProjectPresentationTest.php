<?php

namespace Tests\Feature;

use App\Support\ProjectPresentation;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ProjectPresentationTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_site_and_game_share_public_identity(): void
    {
        config(['project.environment' => []]);
        $name = config('project.name');
        $gameTitle = config('project.game.title') ?? $name;
        $this->get('/')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->where('project.id', config('project.id'))
            ->where('project.name', $name)
            ->where('project.game.title', $gameTitle)
            ->where('project.theme', config('project.theme'))
            ->where('project.homepage.playLabel', config('project.homepage.playLabel')));
        $this->get('/play')->assertOk()->assertSee($gameTitle.' — Play')
            ->assertSee('data-project-game=', false)
            ->assertSee('data-platform-account="0"', false);
        $this->artisan('project:sync', ['--check' => true])->assertSuccessful();
    }

    public function test_alternative_project_metadata_logos_and_admin_presentation(): void
    {
        config([
            'project.environment.name' => 'Aurora & Grove',
            'project.environment.theme' => 'aurora',
            'project.environment.gameTitle' => null,
            'project.game.title' => 'Dawn Watch',
            'project.homepage.playLabel' => 'Enter the grove',
            'project.headerLogo' => '/images/warrior.png',
            'project.footerLogo' => null,
            'project.favicon' => '/images/warrior.png',
            'project.admin.logo' => '/images/warrior.png',
            'project.admin.name' => null,
            'project.admin.primary' => '#556677',
            'project.supportEmail' => 'support@example.test',
        ]);
        $this->get('/login')->assertOk()->assertSee('Aurora & Grove')
            ->assertSee('/project-theme/aurora.css')
            ->assertSee('href="/images/warrior.png"', false)
            ->assertSee('<meta property="og:title" content="Dawn Watch">', false);
        $this->get('/')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->where('project.footerLogo', '/images/warrior.png')
            ->where('project.supportEmail', 'support@example.test')
            ->where('project.homepage.playLabel', 'Enter the grove'));
        $panel = Filament::getPanel('admin');
        $this->assertSame('Aurora & Grove · Treasury', $panel->getBrandName());
        $this->assertSame('/images/warrior.png', $panel->getBrandLogo());
        $this->assertSame('/images/warrior.png', $panel->getFavicon());
        $this->assertArrayHasKey('primary', $panel->getColors());
        $this->assertNotEmpty($panel->getResources());
        $this->get('/admin')->assertRedirect('/admin/login');
        $this->get('/admin/login')->assertRedirect('/login');
    }

    public function test_only_public_fields_are_shared_and_optional_missing_files_fall_back(): void
    {
        config([
            'project.credentials' => 'project-test-private-value',
            'project.game.privateToken' => 'game-test-private-value',
            'project.admin.privateToken' => 'admin-test-private-value',
            'project.headerLogo' => '/branding/missing.png',
            'project.footerLogo' => null,
            'project.socialImage' => null,
        ]);
        $this->get('/')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->where('project.headerLogo', null)
            ->where('project.footerLogo', null)
            ->where('project.socialImage', null)
            ->missing('project.credentials')
            ->missing('project.game.privateToken')
            ->missing('project.admin'));
        $this->artisan('project:sync', ['--check' => true])
            ->expectsOutputToContain('Missing public asset for project headerLogo')
            ->assertFailed();
    }

    #[DataProvider('invalidConfiguration')]
    public function test_invalid_configuration_is_rejected(string $key, string $value, string $error): void
    {
        config(['project.environment' => [], $key => $value]);
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage($error);
        app(ProjectPresentation::class)->website();
    }

    public static function invalidConfiguration(): array
    {
        return [
            'external logo' => ['project.headerLogo', 'https://example.test/logo.svg', 'Invalid public asset path'],
            'traversal' => ['project.headerLogo', '/branding/../favicon.svg', 'Invalid public asset path'],
            'encoded traversal' => ['project.headerLogo', '/branding/%2e%2e/favicon.svg', 'Invalid public asset path'],
            'private link' => ['project.headerLogo', '/storage/private.png', 'Invalid public asset path'],
            'theme' => ['project.environment.theme', 'unregistered', 'Unknown project theme'],
            'game theme' => ['project.game.theme', 'unregistered', 'Unknown game menu theme'],
            'invalid color' => ['project.game.accent', 'red; display:none', 'six-digit hex color'],
            'project id' => ['project.id', 'not a slug', 'Invalid project id slug'],
            'nested unknown key' => ['project.homepage.capture.providerKey', 'synthetic-private-value', 'Invalid project homepage fields'],
        ];
    }
}
