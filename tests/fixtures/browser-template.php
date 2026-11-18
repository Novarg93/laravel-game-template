<?php

use App\Models\User;
use App\Services\WalletService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

// Synthetic accounts in a newly created isolated browser-test database only.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! $app->environment('testing') || config('database.default') !== 'sqlite'
    || basename(config('database.connections.sqlite.database')) !== 'payments-test.sqlite'
    || ! str_contains(str_replace('\\', '/', config('database.connections.sqlite.database')), '/storage/framework/testing/restructure-')) {
    throw new RuntimeException('Refusing browser fixtures outside the isolated restructure database.');
}
$user = User::factory()->create(['email' => 'template-browser@example.test', 'password' => 'Template-test-only-2026!']);
$admin = User::factory()->create(['email' => 'admin@admin.admin', 'password' => 'Template-test-only-2026!', 'is_platform_operator' => true]);
Gate::define('adjust-wallet', fn (User $actor) => $actor->is_platform_operator);
app(WalletService::class)->adjust($user->id, 500, $admin->id, 'Isolated browser regression fixture', (string) Str::uuid());
echo 'Isolated browser fixtures ready.'.PHP_EOL;
