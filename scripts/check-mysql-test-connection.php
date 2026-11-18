<?php

// Read-only diagnostic. It never creates a database/user or runs migrations.
require __DIR__.'/../vendor/autoload.php';

$root = dirname(__DIR__);
Dotenv\Dotenv::createImmutable($root, is_file($root.'/.env.testing') ? '.env.testing' : '.env')->safeLoad();
$value = static fn (string $name, string $fallback = ''): string => (string) ($_ENV[$name] ?? $_SERVER[$name] ?? getenv($name) ?: $fallback);
$host = $value('DB_HOST', '127.0.0.1');
$port = $value('DB_PORT', '3306');
$database = 'pixel_survivor_test';
if (! in_array($host, ['127.0.0.1', 'localhost'], true) || $value('DB_URL') !== '' || ! ctype_digit($port)) {
    fwrite(STDERR, "Refused: tests require a loopback MySQL connection without DB_URL.\n");
    exit(2);
}
try {
    $connection = new PDO('mysql:host='.$host.';port='.$port.';dbname='.$database.';charset=utf8mb4', $value('DB_USERNAME', 'root'), $value('DB_PASSWORD'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 3]);
    if ($connection->query('SELECT DATABASE()')->fetchColumn() !== $database) {
        throw new RuntimeException('Unexpected database');
    }
    echo json_encode(['result' => 'reachable', 'database' => $database, 'version' => $connection->query('SELECT VERSION()')->fetchColumn(), 'writes' => 0], JSON_THROW_ON_ERROR).PHP_EOL;
} catch (PDOException $error) {
    $code = (int) ($error->errorInfo[1] ?? 0);
    echo json_encode(['result' => 'blocked', 'database' => $database, 'mysql_code' => $code,
        'reason' => match ($code) {
            1045 => 'Existing test-account credentials were not supplied or were rejected.',
            1049 => 'The isolated test database does not exist.',
            2002, 2003 => 'The local MySQL service is unavailable.',
            default => 'The isolated MySQL connection could not be verified.',
        }, 'writes' => 0], JSON_THROW_ON_ERROR).PHP_EOL;
    exit(1);
}
