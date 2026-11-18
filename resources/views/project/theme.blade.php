@php($projectTheme = app(\App\Support\ProjectPresentation::class)->theme())
<link rel="stylesheet" href="/project-theme/pixel-survivor.css">
@if ($projectTheme['stylesheet'] !== '/project-theme/pixel-survivor.css')
    <link rel="stylesheet" href="{{ $projectTheme['stylesheet'] }}">
@endif
