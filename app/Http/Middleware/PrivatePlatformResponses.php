<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PrivatePlatformResponses
{
    /** @param Closure(Request):Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        if ($request->is('account', 'account/*', 'dashboard', 'wallet', 'shop', 'inventory', 'currency', 'operations*', 'runs', 'runs/*', 'settings/*', 'payments/*', 'internal', 'internal/*')) {
            $response->headers->set('Cache-Control', 'private, no-store');
        }

        return $response;
    }
}
