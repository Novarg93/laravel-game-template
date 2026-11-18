<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CommerceController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CurrencyPreferenceController;
use App\Http\Controllers\GuideController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\OperationsController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PaymentWebhookController;
use App\Http\Controllers\ProgressionController;
use App\Http\Controllers\PublicProfileController;
use App\Http\Controllers\RunHistoryController;
use App\Http\Middleware\LimitRunPayload;
use App\Payments\TestPaymentGuard;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'Welcome')->name('home');
Route::post('/currency', CurrencyPreferenceController::class)->middleware('throttle:30,1,currency-selection-')->name('currency.select');
Route::get('/guide', GuideController::class)->name('guide');
Route::inertia('/faq', 'Faq')->name('faq');
Route::get('/leaderboard', [LeaderboardController::class, 'index'])->middleware('throttle:60,1,leaderboard-page-')->name('leaderboard');
Route::get('/leaderboard/runs/{publicRun}', [LeaderboardController::class, 'show'])->whereUuid('publicRun')->middleware('throttle:60,1,leaderboard-detail-')->name('leaderboard.run');
Route::middleware(['auth', 'verified', 'can:operate-platform'])->group(function (): void {
    Route::get('/operations', [OperationsController::class, 'index'])->middleware('throttle:30,1,operations-read-');
    Route::get('/operations/runs/{run}', [OperationsController::class, 'show'])->whereUuid('run')->middleware('throttle:30,1,operations-run-');
    Route::get('/operations/users/{user}', [OperationsController::class, 'user'])->whereNumber('user')->middleware('throttle:20,1,operations-user-');
    Route::get('/operations/users', [OperationsController::class, 'users'])->middleware('throttle:20,1,operations-users-');
});

Route::get('/contact', fn () => Inertia::render('Contact', ['received' => session('contactReceived', false)]))->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:3,10,contact-submit-')->name('contact.store');
Route::get('/privacy', fn () => Inertia::render('Legal', ['kind' => 'privacy']))->name('privacy');
Route::get('/terms', fn () => Inertia::render('Legal', ['kind' => 'terms']))->name('terms');
Route::view('/play', 'play')->name('play');

Route::stripeWebhooks('webhook')->name('stripe.webhook');

Route::post('/payments/webhooks/{provider}', PaymentWebhookController::class)->middleware([LimitRunPayload::class, 'throttle:120,1,payment-webhook-']);
if (app(TestPaymentGuard::class)->enabled()) {
    require __DIR__.'/payment-test.php';
}

Route::middleware(['auth', 'verified'])->group(function () {
    Route::redirect('/account', '/dashboard');
    Route::get('/account/orders', [AccountController::class, 'orders'])->name('account.orders');
    Route::get('/account/orders/payment/{order}/invoice', [AccountController::class, 'invoice'])->whereUuid('order')->middleware('throttle:20,1,invoice-read-')->name('account.invoice');
    Route::get('/account/orders/{kind}/{order}', [AccountController::class, 'order'])->where('kind', 'payment|shop')->whereUuid('order')->name('account.order');
    Route::redirect('/account/transactions', '/account/orders')->name('account.transactions');
    Route::redirect('/account/tokens', '/account/orders')->name('account.tokens');
    Route::redirect('/account/inventory-usage', '/inventory#service-usage')->name('account.inventory-usage');
    Route::get('/payments/{order}', [PaymentController::class, 'result'])->whereUuid('order')->middleware('throttle:60,1,payment-page-');
    Route::get('/payments/{order}/{view}', [PaymentController::class, 'result'])->whereUuid('order')->where('view', 'success|pending|failed|canceled')->middleware('throttle:60,1,payment-page-');
    Route::get('/wallet', [CommerceController::class, 'walletPage'])->name('wallet');
    Route::get('/shop', [CommerceController::class, 'shopPage'])->name('shop');
    Route::get('/inventory', [CommerceController::class, 'inventoryPage'])->name('inventory');
    Route::get('dashboard', [ProgressionController::class, 'dashboard'])->name('dashboard');
    Route::get('/settings/public-profile', [PublicProfileController::class, 'edit'])->name('public-profile.edit');
    Route::get('/runs', [RunHistoryController::class, 'index'])->middleware('throttle:60,1,run-history-');
    Route::get('/runs/{run}', [RunHistoryController::class, 'show'])->whereUuid('run')->middleware('throttle:60,1,run-history-detail-');

});

require __DIR__.'/internal.php';

require __DIR__.'/settings.php';
