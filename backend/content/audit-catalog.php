<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__).'/dbconfig.php';
require __DIR__.'/lessons.php';
if (!$conn) throw new RuntimeException('Database unavailable');
echo json_encode(content_lessons($conn),JSON_UNESCAPED_UNICODE);
