<?php
// backend/dbconfig.php
$host = "localhost";
$db_name = "pianomagicoweb";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->exec("set names utf8");
} catch(PDOException $exception) {
    // Error will be caught by the calling script
    $conn = null;
}
?>
