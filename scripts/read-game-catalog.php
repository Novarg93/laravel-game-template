<?php

// This check reads repository definitions only. It does not boot Laravel or connect to a database.
$config = __DIR__.'/../config/';
$progression = require $config.'progression.php';
$shop = require $config.'shop.php';
$premium = require $config.'premium.php';
$inventory = require $config.'inventory.php';
$runItems = require $config.'run_items.php';
$review = require $config.'run_review.php';

echo json_encode([
    'heroIds' => array_keys($progression['characters']),
    'pools' => $progression['character_abilities'],
    'mapIds' => $progression['maps'],
    'maxLevel' => $progression['max_level'],
    'items' => array_keys($inventory['items']),
    'shopItemIds' => array_values(array_map(fn ($product) => $product['item_id'] ?? null, $shop['products'])),
    'premiumItemIds' => array_keys($premium['consumables']),
    'enemyPoints' => $review['enemy_points'],
    'regularKinds' => $review['regular_kinds'],
    'runItemIds' => array_keys($runItems['items']),
], JSON_THROW_ON_ERROR);
