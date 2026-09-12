<?php
// backend/dbconfig.php
$is_production = isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') === false && strpos($_SERVER['HTTP_HOST'], '127.0.0.1') === false;

if ($is_production) {
    $host = "localhost";
    $db_name = "u803496046_pianomagicoweb";
    $username = "u803496046_pianomagicoweb";
    $password = "6A8edb2013";
} else {
    $host = "localhost";
    $db_name = "pianomagicoweb";
    $username = "root";
    $password = "";
}

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->exec("set names utf8");
} catch(PDOException $exception) {
    $conn = null;
}
?>
