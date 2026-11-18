<?php

namespace Tests\Feature;

use App\Http\Middleware\RequireCsrfToken;
use App\Models\Currency;
use App\Models\User;
use App\Services\CurrencyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Tests\TestCase;

class InternalApplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_internal_route_uses_web_auth_verification_and_throttling(): void
    {
        $count = 0;
        foreach (Route::getRoutes() as $route) {
            $this->assertFalse(str_starts_with($route->uri(), 'api/'));
            if (! str_starts_with($route->uri(), 'internal/')) {
                continue;
            }
            $count++;
            $middleware = $route->gatherMiddleware();
            $this->assertContains('web', $middleware);
            $this->assertContains('auth', $middleware);
            $this->assertContains('verified', $middleware);
            $this->assertTrue((bool) array_filter($middleware, fn ($name) => str_starts_with($name, 'throttle:')));
            $this->assertContains(RequireCsrfToken::class, app('router')->gatherRouteMiddleware($route));
        }
        $this->assertSame(25, $count);
    }

    public function test_old_api_endpoints_are_gone_and_internal_endpoints_reject_guests(): void
    {
        foreach (['wallet', 'inventory', 'shop', 'progress', 'leaderboard', 'operations/health'] as $path) {
            $this->getJson('/api/v1/'.$path)->assertNotFound();
        }
        $this->postJson('/api/v1/runs', [])->assertNotFound();
        $this->getJson('/internal/wallet')->assertUnauthorized()->assertHeader('Cache-Control', 'no-store, private');
        $this->postJson('/internal/runs', [])->assertUnauthorized();
        $this->postJson('/internal/shop/purchases', [])->assertUnauthorized();
    }

    public function test_verified_email_is_still_required(): void
    {
        $this->actingAs(User::factory()->unverified()->create());
        $this->getJson('/internal/wallet')->assertForbidden();
        $this->postJson('/internal/runs', [])->assertForbidden();
    }

    public function test_real_csrf_check_requires_token_even_for_same_origin_metadata(): void
    {
        // Laravel bypasses CSRF in unit tests by default. Enable the real check explicitly.
        $this->enforceCsrf();
        $this->actingAs(User::factory()->create())->withSession(['_token' => 'test-session-csrf']);
        $body = ['operation_id' => (string) Str::uuid(), 'client_run_id' => (string) Str::uuid(), 'character_id' => 'mage', 'biome_id' => 'grove', 'mode' => 'normal'];
        $this->postJson('/internal/runs', $body, ['Sec-Fetch-Site' => 'same-origin'])->assertStatus(419)->assertJsonPath('error', 'session_expired');
        $this->postJson('/internal/runs', $body, ['X-CSRF-TOKEN' => 'invalid'])->assertStatus(419);
        $this->postJson('/internal/runs', $body, ['X-CSRF-TOKEN' => 'test-session-csrf'])->assertOk();
    }

    public function test_pages_keep_their_urls_and_account_routes_require_sessions(): void
    {
        foreach (['/', '/play', '/guide', '/faq', '/contact', '/privacy', '/terms', '/login', '/register', '/leaderboard'] as $url) {
            $this->get($url)->assertOk();
        }
        $this->get('/admin/login')->assertRedirect('/login');
        $this->get('/dashboard')->assertRedirect('/login');
        $this->actingAs(User::factory()->create());
        foreach (['/dashboard', '/shop', '/wallet', '/inventory', '/runs', '/account/orders', '/settings/profile', '/settings/appearance', '/settings/public-profile'] as $url) {
            $this->get($url)->assertOk();
        }
        $this->get('/account/transactions')->assertRedirect('/account/orders');
        $this->get('/account/tokens')->assertRedirect('/account/orders');
        $this->get('/account/inventory-usage')->assertRedirect('/inventory#service-usage');
    }

    public function test_sensitive_snapshots_are_private_and_validation_is_retained(): void
    {
        $this->actingAs(User::factory()->create());
        foreach (['wallet', 'inventory', 'shop', 'progress'] as $path) {
            $this->getJson('/internal/'.$path)->assertOk()->assertHeader('Cache-Control', 'no-store, private');
        }
        $this->postJson('/internal/runs', [])->assertUnprocessable();
    }

    public function test_operator_gate_and_filament_policy_remain_enforced(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->getJson('/internal/operations/health')->assertForbidden();
        $this->get('/admin')->assertForbidden();
        $this->assertFalse(Gate::forUser($user)->allows('create', Currency::class));
        $operator = User::factory()->create(['is_platform_operator' => true]);
        $this->actingAs($operator)->get('/operations')->assertOk();
        $this->getJson('/internal/operations/health')->assertOk();
        $admin = User::factory()->create(['email' => 'admin@admin.admin']);
        $this->assertTrue(Gate::forUser($admin)->allows('create', Currency::class));
        $this->actingAs($admin)->get('/admin')->assertOk();
    }

    public function test_currency_conversion_retains_exact_integer_rounding(): void
    {
        Currency::create(['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'exchange_rate' => '1.25000000', 'decimal_places' => 2, 'is_active' => true, 'is_default' => false, 'sort_order' => 1]);
        $this->assertSame('125', app(CurrencyService::class)->convert('100', 'EUR', 'USD'));
        $this->assertSame('1', app(CurrencyService::class)->convert('1', 'USD', 'EUR'));
    }
}
