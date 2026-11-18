<?php

// Loaded by web.php: session authentication, verified email and CSRF remain enabled.
use App\Http\Controllers\CommerceController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\OperationsController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProgressionController;
use App\Http\Controllers\PublicProfileController;
use App\Http\Controllers\RunHistoryController;
use App\Http\Controllers\RunItemController;
use App\Http\Controllers\RunPaidActionController;
use App\Http\Middleware\LimitRunPayload;
use Illuminate\Support\Facades\Route;

Route::prefix('internal')->middleware(['auth', 'verified', LimitRunPayload::class])->group(function () {
    Route::post('/runs/{run}/upgrade-offers', [RunPaidActionController::class, 'offer'])->whereUuid('run')->middleware('throttle:60,1,run-upgrade-offer-');
    Route::post('/runs/{run}/actions', [RunPaidActionController::class, 'execute'])->whereUuid('run')->middleware('throttle:30,1,run-paid-action-');
    Route::get('/runs/{run}/actions/{operation}', [RunPaidActionController::class, 'recover'])->whereUuid('run')->whereUuid('operation')->middleware('throttle:60,1,run-paid-recovery-');
    Route::post('/runs/{run}/actions/{operation}/ack', [RunPaidActionController::class, 'acknowledge'])->whereUuid('run')->whereUuid('operation')->middleware('throttle:60,1,run-paid-ack-');
    Route::post('/profile/nickname', [PublicProfileController::class, 'update'])->middleware('throttle:10,1,nickname-change-');
    Route::get('/runs/{run}/status', [RunHistoryController::class, 'status'])->whereUuid('run')->middleware('throttle:60,1,run-status-');
    Route::post('/payments/quote', [PaymentController::class, 'quote'])->middleware('throttle:30,1,payment-quote-');
    Route::post('/payments/orders', [PaymentController::class, 'create'])->middleware('throttle:10,1,payment-create-');
    Route::post('/payments/orders/{order}/dev-confirm', [PaymentController::class, 'confirmDev'])->whereUuid('order')->middleware('throttle:10,1,payment-dev-confirm-');
    Route::get('/payments/orders/{order}', [PaymentController::class, 'show'])->whereUuid('order')->middleware('throttle:60,1,payment-status-');
    Route::post('/payments/orders/{order}/checkout', [PaymentController::class, 'checkout'])->whereUuid('order')->middleware('throttle:10,1,payment-checkout-');
    Route::get('/wallet', [CommerceController::class, 'wallet'])->middleware('throttle:60,1,wallet-read-');
    Route::get('/shop', [CommerceController::class, 'shop'])->middleware('throttle:60,1,shop-read-');
    Route::post('/shop/purchases', [CommerceController::class, 'purchase'])->middleware('throttle:15,1,shop-purchase-');
    Route::get('/progress', [ProgressionController::class, 'show'])->middleware('throttle:60,1,progress-read-');
    // One bounded snapshot returns definitions, balances, recent operations and active effects.
    Route::get('/inventory', [InventoryController::class, 'show'])->middleware('throttle:60,1,inventory-read-');
    Route::post('/inventory/activate-xp-boost', [InventoryController::class, 'activate'])->middleware('throttle:10,1,inventory-activate-');
    Route::post('/runs', [ProgressionController::class, 'start'])->middleware('throttle:10,1,run-start-');
    Route::get('/runs/{run}/inventory', [RunItemController::class, 'show'])->whereUuid('run')->middleware('throttle:60,1,run-items-read-');
    Route::post('/runs/{run}/death', [RunItemController::class, 'death'])->whereUuid('run')->middleware('throttle:20,1,run-death-');
    Route::post('/runs/{run}/items', [RunItemController::class, 'consume'])->whereUuid('run')->middleware('throttle:30,1,run-items-use-');
    Route::post('/runs/{run}/items/{usage}/ack', [RunItemController::class, 'acknowledge'])->whereUuid('run')->whereUuid('usage')->middleware('throttle:60,1,run-items-ack-');
    Route::post('/runs/{run}/finish', [ProgressionController::class, 'finish'])->whereUuid('run')->middleware('throttle:30,1,run-finish-');
});

Route::prefix('internal')->middleware(['auth', 'verified', 'can:operate-platform'])->group(function (): void {
    Route::get('/operations/health', [OperationsController::class, 'health'])->middleware('throttle:2,1,operations-health-');
    Route::post('/operations/runs/{run}/review', [OperationsController::class, 'decide'])->whereUuid('run')->middleware([LimitRunPayload::class, 'throttle:10,1,operations-review-']);
});
