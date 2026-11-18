@if ($legacyFavicon && $legacyFavicon !== $favicon)
    <link rel="icon" href="{{ $legacyFavicon }}" sizes="any">
@endif
@if ($favicon)
    <link rel="icon" href="{{ $favicon }}">
@endif
@if ($touchIcon)
    <link rel="apple-touch-icon" href="{{ $touchIcon }}">
@endif
