<?php
header('Content-Type: text/plain; charset=utf-8');

echo "=== Server Diagnostic ===\n\n";

// PHP version
echo "PHP Version: " . PHP_VERSION . "\n\n";

// Check SQLite support
echo "--- SQLite Support ---\n";
echo "pdo_sqlite loaded: " . (extension_loaded('pdo_sqlite') ? "YES" : "NO") . "\n";
echo "sqlite3 loaded: "    . (extension_loaded('sqlite3')    ? "YES" : "NO") . "\n\n";

// Check folder permission
echo "--- Folder Permission ---\n";
$apiDir = __DIR__;
echo "api/ folder path: " . $apiDir . "\n";
echo "api/ is writable: " . (is_writable($apiDir) ? "YES" : "NO -- THIS IS THE PROBLEM") . "\n\n";

// Try to create the database
echo "--- Database Test ---\n";
$dbFile = __DIR__ . '/khamar.db';

if (file_exists($dbFile)) {
    echo "khamar.db already exists (" . filesize($dbFile) . " bytes)\n";
} else {
    echo "khamar.db does not exist yet — trying to create...\n";
    try {
        $pdo = new PDO("sqlite:$dbFile");
        $pdo->exec("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)");
        echo "SUCCESS — khamar.db created! SQLite is working.\n";
        // Clean up test table
        $pdo->exec("DROP TABLE IF EXISTS test");
    } catch (Exception $e) {
        echo "FAILED — Error: " . $e->getMessage() . "\n";
        echo "FIX: Change api/ folder permission to 755 in File Manager\n";
    }
}

echo "\n=== Done ===\n";
echo "After reading this, delete api/test.php from the server.\n";
