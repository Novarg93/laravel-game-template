<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Http\Request;

/** Keep token verification mandatory for internal mutations, even with Fetch Metadata. */
class RequireCsrfToken extends PreventRequestForgery
{
    /** @param Request $request */
    protected function hasValidOrigin($request): bool
    {
        return $request->is('internal', 'internal/*') ? false : parent::hasValidOrigin($request);
    }
}
