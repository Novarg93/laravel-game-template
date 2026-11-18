<?php

namespace Tests\Feature;

use App\Models\CreditTransaction;
use App\Models\GameRun;
use App\Models\InventoryBalance;
use App\Models\PaymentOrder;
use App\Models\PaymentWebhookInbox;
use App\Models\User;
use App\Models\Wallet;
use App\Payments\Data\WebhookDelivery;
use App\Payments\PaymentStatus;
use App\Payments\Providers\TestPaymentProvider;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class InternalEconomyTest extends TestCase
{
    use RefreshDatabase;

    private function fund(User $user, int $amount = 500): void
    {
        Gate::define('adjust-wallet', fn (User $actor) => $actor->is_platform_operator);
        $actor = User::factory()->create(['is_platform_operator' => true]);
        app(WalletService::class)->adjust($user->id, $amount, $actor->id, 'Isolated regression test fixture', (string) Str::uuid());
    }

    private function start(User $user): array
    {
        return $this->actingAs($user)->postJson('/internal/runs', ['operation_id' => (string) Str::uuid(), 'client_run_id' => (string) Str::uuid(), 'character_id' => 'mage', 'biome_id' => 'grove', 'mode' => 'normal'])->assertOk()->json();
    }

    private function deliver(WebhookDelivery $delivery): TestResponse
    {
        return $this->call('POST', '/payments/webhooks/test', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json', 'HTTP_X_TEST_TIMESTAMP' => (string) $delivery->signature->timestamp, 'HTTP_X_TEST_SIGNATURE' => $delivery->signature->digest], $delivery->raw);
    }

    public function test_purchase_retry_keeps_one_debit_and_one_inventory_grant(): void
    {
        $user = User::factory()->create();
        $this->fund($user);
        $request = ['operation_id' => (string) Str::uuid(), 'product_key' => 'healing_potion', 'quantity' => 2, 'expected_unit_price' => 25];
        $first = $this->actingAs($user)->postJson('/internal/shop/purchases', $request)->assertOk()->json('receipt');
        $this->postJson('/internal/shop/purchases', $request)->assertOk()->assertJsonPath('receipt.id', $first['id']);
        $this->assertSame(450, Wallet::where('user_id', $user->id)->firstOrFail()->balance);
        $this->assertSame(2, InventoryBalance::where('user_id', $user->id)->where('item_id', 'healing_potion')->firstOrFail()->quantity);
        $this->assertSame(1, CreditTransaction::where('user_id', $user->id)->where('type', 'shop_purchase')->count());
        $this->postJson('/internal/shop/purchases', [...$request, 'quantity' => 3])->assertConflict();
        $this->assertSame([], app(WalletService::class)->audit($user->id)['mismatches']);
    }

    public function test_foreign_run_cannot_be_read_or_modified(): void
    {
        $owner = User::factory()->create();
        $run = $this->start($owner);
        $id = $run['server_run_id'];
        $this->actingAs(User::factory()->create());
        foreach (['inventory', 'status'] as $suffix) {
            $this->getJson('/internal/runs/'.$id.'/'.$suffix)->assertNotFound();
        }
        $this->postJson('/internal/runs/'.$id.'/death', ['client_run_id' => $run['client_run_id'], 'death_id' => (string) Str::uuid(), 'elapsed' => 0])->assertNotFound();
        $this->postJson('/internal/runs/'.$id.'/upgrade-offers', [])->assertNotFound();
        $this->assertSame('active', GameRun::findOrFail($id)->lifecycle_state);
    }

    public function test_reroll_retry_recovery_and_ack_never_double_charge(): void
    {
        $user = User::factory()->create();
        $this->fund($user);
        $run = $this->start($user);
        $url = '/internal/runs/'.$run['server_run_id'];
        $offer = $this->postJson($url.'/upgrade-offers', ['client_run_id' => $run['client_run_id'], 'level' => 2, 'hero_level' => 2, 'elapsed' => 0, 'upgrades' => [], 'ultimate' => null])->assertOk()->json();
        $body = ['operation_id' => (string) Str::uuid(), 'client_run_id' => $run['client_run_id'], 'action' => 'skill_reroll', 'confirmed' => true, 'elapsed' => 0, 'offer_id' => $offer['id'], 'generation' => 0];
        $receipt = $this->postJson($url.'/actions', $body)->assertOk()->json();
        $this->postJson($url.'/actions', $body)->assertOk()->assertJsonPath('id', $receipt['id']);
        $this->getJson($url.'/actions/'.$body['operation_id'])->assertOk()->assertJsonPath('receipt.id', $receipt['id']);
        $this->postJson($url.'/actions/'.$body['operation_id'].'/ack', [])->assertOk();
        $this->getJson($url.'/actions/'.$body['operation_id'])->assertJsonPath('status', 'applied');
        $this->assertSame(475, Wallet::where('user_id', $user->id)->firstOrFail()->balance);
        $this->assertSame(1, CreditTransaction::where('user_id', $user->id)->where('type', 'shop_purchase')->count());
    }

    public function test_resurrection_and_item_consumption_remain_idempotent(): void
    {
        $user = User::factory()->create();
        $this->fund($user);
        $run = $this->start($user);
        $url = '/internal/runs/'.$run['server_run_id'];
        $this->postJson('/internal/shop/purchases', ['operation_id' => (string) Str::uuid(), 'product_key' => 'healing_potion', 'quantity' => 1, 'expected_unit_price' => 25])->assertOk();
        $body = ['operation_id' => (string) Str::uuid(), 'client_run_id' => $run['client_run_id'], 'item_id' => 'healing_potion', 'elapsed' => 0, 'hp' => 40, 'max_hp' => 100];
        $receipt = $this->postJson($url.'/items', $body)->assertOk()->json();
        $this->postJson($url.'/items', $body)->assertOk()->assertJsonPath('id', $receipt['id']);
        $this->postJson($url.'/items/'.$receipt['id'].'/ack', [])->assertOk();
        $death = (string) Str::uuid();
        $this->postJson($url.'/death', ['client_run_id' => $run['client_run_id'], 'death_id' => $death, 'elapsed' => 0])->assertOk();
        $revive = ['operation_id' => (string) Str::uuid(), 'client_run_id' => $run['client_run_id'], 'action' => 'resurrection', 'confirmed' => true, 'elapsed' => 0, 'death_id' => $death];
        $first = $this->postJson($url.'/actions', $revive)->assertOk()->json();
        $this->postJson($url.'/actions', $revive)->assertOk()->assertJsonPath('id', $first['id']);
        $this->assertSame(375, Wallet::where('user_id', $user->id)->firstOrFail()->balance);
        $this->assertSame(1, GameRun::findOrFail($run['server_run_id'])->revive_count);
    }

    public function test_pending_tokens_are_not_spendable_and_prices_are_server_owned(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->postJson('/internal/payments/orders', ['operation_id' => (string) Str::uuid(), 'custom_credits' => 100])->assertOk();
        $this->assertSame(0, Wallet::where('user_id', $user->id)->firstOrFail()->balance);
        $this->postJson('/internal/shop/purchases', ['operation_id' => (string) Str::uuid(), 'product_key' => 'healing_potion', 'quantity' => 1, 'expected_unit_price' => 25])->assertConflict();
        $this->postJson('/internal/payments/quote', ['custom_credits' => 100, 'amount_minor' => 1])->assertUnprocessable();
        $this->assertSame(0, CreditTransaction::where('user_id', $user->id)->count());
    }

    public function test_signed_external_webhook_preserves_raw_payload_replay_protection_and_exactly_once_grant(): void
    {
        $user = User::factory()->create();
        $body = ['operation_id' => (string) Str::uuid(), 'custom_credits' => 100];
        $order = $this->actingAs($user)->postJson('/internal/payments/orders', $body)->assertOk()->json('order');
        $this->postJson('/internal/payments/orders', $body)->assertOk()->assertJsonPath('order.id', $order['id']);
        $provider = app(TestPaymentProvider::class);
        $checkout = PaymentOrder::findOrFail($order['id'])->provider_checkout_id;
        $delivery = $provider->simulate($user->id, $checkout, PaymentStatus::Succeeded);
        $this->enforceCsrf();
        auth()->forgetGuards(); // External callback is independent of the browser session.
        $this->deliver($delivery)->assertOk();
        $this->deliver($delivery)->assertOk();
        $this->assertSame(100, Wallet::where('user_id', $user->id)->firstOrFail()->balance);
        $this->assertSame(1, CreditTransaction::where('user_id', $user->id)->where('type', 'payment_credit')->count());
        $this->assertSame($delivery->raw, PaymentWebhookInbox::firstOrFail()->payload);
        $this->assertSame(2, PaymentWebhookInbox::firstOrFail()->delivery_count);
        $this->deliver($provider->sign($delivery->raw, now()->subMinutes(10)->getTimestamp()))->assertUnauthorized();
        $bad = new WebhookDelivery($delivery->raw.' ', $delivery->signature);
        $this->deliver($bad)->assertUnauthorized();
        $this->actingAs(User::factory()->create())->getJson('/internal/payments/orders/'.$order['id'])->assertNotFound();
        $this->assertSame([], app(WalletService::class)->audit($user->id)['mismatches']);
    }

    public function test_run_start_finish_retries_and_foreign_finish_keep_one_authoritative_receipt(): void
    {
        $owner = User::factory()->create();
        $start = ['operation_id' => (string) Str::uuid(), 'client_run_id' => (string) Str::uuid(), 'character_id' => 'mage', 'biome_id' => 'grove', 'mode' => 'normal'];
        $run = $this->actingAs($owner)->postJson('/internal/runs', $start)->assertOk()->json();
        $this->postJson('/internal/runs', $start)->assertOk()->assertJsonPath('server_run_id', $run['server_run_id']);
        $record = ['id' => $run['client_run_id'], 'outcome' => 'defeat', 'completionKind' => 'defeat', 'elapsed' => 0,
            'score' => 0, 'kills' => 0, 'level' => 1, 'finishedAt' => now()->toISOString(), 'abilities' => ['fireball'],
            'byKind' => array_fill_keys(array_keys(config('run_review.enemy_points')), 0),
            'finalEncounter' => ['reached' => false, 'killed' => false, 'duration' => 0],
            'details' => ['character' => 'mage', 'biome' => 'grove', 'regularKills' => 0, 'eliteKills' => 0, 'bossKills' => 0, 'damage' => []]];
        $url = '/internal/runs/'.$run['server_run_id'].'/finish';
        $this->actingAs(User::factory()->create())->postJson($url, ['record' => $record])->assertNotFound();
        $receipt = $this->actingAs($owner)->postJson($url, ['record' => $record])->assertOk()->json();
        $this->postJson($url, ['record' => $record])->assertOk()->assertExactJson($receipt);
        $this->assertSame(1, GameRun::where('user_id', $owner->id)->count());
        $this->getJson('/internal/runs/'.$run['server_run_id'].'/status')->assertOk();
    }

    public function test_stripe_webhook_url_verifies_signature_without_session_or_csrf(): void
    {
        $this->enforceCsrf();
        config(['stripe-webhooks.signing_secret' => 'whsec_isolated_test']);
        Queue::fake();
        $raw = json_encode(['id' => 'evt_route_regression', 'object' => 'event', 'type' => 'payment_intent.succeeded', 'data' => ['object' => ['id' => 'pi_test', 'object' => 'payment_intent', 'livemode' => false]]], JSON_THROW_ON_ERROR);
        $timestamp = now()->getTimestamp();
        $signature = 't='.$timestamp.',v1='.hash_hmac('sha256', $timestamp.'.'.$raw, 'whsec_isolated_test');
        $this->call('POST', '/webhook', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_STRIPE_SIGNATURE' => $signature], $raw)->assertOk();
        $this->assertDatabaseCount('webhook_calls', 1);
        $this->call('POST', '/webhook', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_STRIPE_SIGNATURE' => 't='.$timestamp.',v1=invalid'], $raw)->assertStatus(400);
    }
}
