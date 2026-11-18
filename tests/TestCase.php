<?php

namespace Tests;

use App\Http\Middleware\RequireCsrfToken;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        config(['inertia.ssr.enabled' => false]);
    }

    protected function enforceCsrf(): void
    {
        $this->app->bind(RequireCsrfToken::class, fn ($app) => new class($app, $app['encrypter']) extends RequireCsrfToken
        {
            protected function runningUnitTests(): bool
            {
                return false;
            }
        });
    }
}
