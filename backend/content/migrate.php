<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/dbconfig.php';
require __DIR__ . '/schema.php';
if (!$conn) throw new RuntimeException('Database unavailable');
$seed = json_decode(file_get_contents(__DIR__ . '/seed.json'), true, 512, JSON_THROW_ON_ERROR);
prepare_content_schema($conn, $seed);
echo "Content schema ready; existing lessons/progress unchanged; first-song resolved without changing current behavior.\n";
