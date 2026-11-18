<!DOCTYPE html>
@php($presentation = app(\App\Support\ProjectPresentation::class))
@php($game = $presentation->game())
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $game['title'] }} — Play</title>
    <meta name="description" content="{{ $game['description'] }}">
    @include('project.icons', ['favicon' => $game['favicon'] ?? $presentation->favicon(), 'legacyFavicon' => null, 'touchIcon' => null])
    @vite('resources/js/game.ts')
</head>
<body><div id="app" data-platform-account="{{ auth()->check() ? '1' : '0' }}" data-project-game="{{ json_encode($game, JSON_THROW_ON_ERROR) }}"></div></body>
</html>
