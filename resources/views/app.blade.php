<!DOCTYPE html>
@php($project = $page['props']['project'])
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"  @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        @include('project.theme')
        @include('project.icons', $project)
        <meta name="description" content="{{ $project['description'] }}">
        <meta property="og:site_name" content="{{ $project['name'] }}">
        <meta property="og:title" content="{{ $project['game']['title'] }}">
        <meta property="og:description" content="{{ $project['description'] }}">
        @if ($project['socialImage'])
            <meta property="og:image" content="{{ url($project['socialImage']) }}">
        @endif

        @vite(['resources/css/app.css', 'resources/js/app.ts', "resources/js/pages/{$page['component']}.vue"])
        <x-inertia::head>
            <title>{{ $project['name'] }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
