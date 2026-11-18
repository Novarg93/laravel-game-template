<?php

return [
    // Experimental entries are rejected in production, even if configured here.
    'preset' => env('GAME_CONTENT_PRESET', 'pixel-survivor'),
];
