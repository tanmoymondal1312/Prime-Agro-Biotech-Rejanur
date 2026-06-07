<?php

// ── Load .env ─────────────────────────────────────────────────────────────────
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        putenv(trim($k) . '=' . trim($v));
    }
}

function getDB(): PDO {
    $host   = getenv('DB_HOST') ?: 'localhost';
    $port   = getenv('DB_PORT') ?: '3306';
    $dbname = getenv('DB_NAME') ?: 'khamar_portal';
    $user   = getenv('DB_USER') ?: 'root';
    $pass   = getenv('DB_PASS') ?: '';

    try {
        $pdo = new PDO(
            "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
            $user, $pass,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );

        // ── Auto-create / migrate tables ──────────────────────────────────────
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS profiles (
                id          VARCHAR(36)  PRIMARY KEY,
                name        VARCHAR(255) NOT NULL,
                owner_uid   VARCHAR(100) NOT NULL DEFAULT 'local-user',
                photo_url   VARCHAR(500) NULL,
                is_archived TINYINT(1)   NOT NULL DEFAULT 0,
                archived_at VARCHAR(50)  NULL,
                created_at  VARCHAR(50)  NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        // Add photo_url if upgrading from old schema without it
        try {
            $pdo->exec("ALTER TABLE profiles ADD COLUMN photo_url VARCHAR(500) NULL");
        } catch (PDOException) {}

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS cows (
                id                  VARCHAR(36)   PRIMARY KEY,
                tag                 VARCHAR(100)  NULL,
                category            VARCHAR(20)   NOT NULL,
                profile_id          VARCHAR(36)   NOT NULL,
                entry_date          VARCHAR(20)   NOT NULL,
                purchase_price      DECIMAL(15,2) DEFAULT 0,
                gender              VARCHAR(50)   NOT NULL,
                profit_type         VARCHAR(50)   NOT NULL,
                address             VARCHAR(500)  NULL,
                additional_expenses DECIMAL(15,2) DEFAULT 0,
                loan_amount         DECIMAL(15,2) DEFAULT 0,
                treatment_cost      DECIMAL(15,2) DEFAULT 0,
                notes               TEXT          NULL,
                cow_image_url       VARCHAR(500)  NULL,
                receipt_image_url   VARCHAR(500)  NULL,
                sale_price          DECIMAL(15,2) NULL,
                is_sold             TINYINT(1)    DEFAULT 0,
                sale_date           VARCHAR(20)   NULL,
                owner_uid           VARCHAR(100)  NOT NULL DEFAULT 'local-user',
                created_at          VARCHAR(50)   NULL,
                FOREIGN KEY (profile_id) REFERENCES profiles(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS transactions (
                id     VARCHAR(36)   PRIMARY KEY,
                cow_id VARCHAR(36)   NOT NULL,
                type   VARCHAR(20)   NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                date   VARCHAR(20)   NOT NULL,
                note   TEXT          NULL,
                FOREIGN KEY (cow_id) REFERENCES cows(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        // ── Pro1: সমন্বিত কৃষি ট্রেড ─────────────────────────────────────────
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS krishi_profiles (
                id            VARCHAR(36)   PRIMARY KEY,
                name          VARCHAR(255)  NOT NULL,
                start_date    VARCHAR(20)   NOT NULL,
                land_size     VARCHAR(100)  NULL,
                active        TINYINT(1)    DEFAULT 1,
                status        VARCHAR(20)   DEFAULT 'live',
                type          VARCHAR(30)   DEFAULT 'cultivation',
                archived_date VARCHAR(50)   NULL,
                expected_sale DECIMAL(15,2) DEFAULT 0,
                actual_sale   DECIMAL(15,2) DEFAULT 0,
                expenses      LONGTEXT,
                sales         LONGTEXT,
                stocks        LONGTEXT,
                stock_sales   LONGTEXT,
                created_at    VARCHAR(50)   NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS krishi_weather_logs (
                id         VARCHAR(36) PRIMARY KEY,
                date       VARCHAR(20) NOT NULL,
                comment    TEXT        NOT NULL,
                created_at VARCHAR(50) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS krishi_farm_plans (
                id         VARCHAR(36) PRIMARY KEY,
                date       VARCHAR(20) NOT NULL,
                end_date   VARCHAR(20) NULL,
                activity   TEXT        NOT NULL,
                color      VARCHAR(20) NULL,
                status     VARCHAR(20) DEFAULT 'pending',
                created_at VARCHAR(50) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        // ── Pro2: দেনা পাওনার হিসাব ──────────────────────────────────────────
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS takatrack_borrowers (
                id         VARCHAR(36)  PRIMARY KEY,
                name       VARCHAR(255) NOT NULL,
                phone      VARCHAR(50)  NULL,
                address    VARCHAR(500) NULL,
                photo_url  VARCHAR(500) NULL,
                nid        VARCHAR(100) NULL,
                risk_level VARCHAR(20)  DEFAULT 'Low'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS takatrack_loans (
                id               VARCHAR(36)   PRIMARY KEY,
                borrower_id      VARCHAR(36)   NOT NULL,
                amount           DECIMAL(15,2) NOT NULL,
                remaining_amount DECIMAL(15,2) NOT NULL,
                category         VARCHAR(50)   NOT NULL,
                reason           TEXT          NULL,
                give_date        VARCHAR(35)   NOT NULL,
                due_date         VARCHAR(35)   NOT NULL,
                status           VARCHAR(20)   NOT NULL,
                notes            TEXT          NULL,
                payments         LONGTEXT,
                FOREIGN KEY (borrower_id) REFERENCES takatrack_borrowers(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        // Expand date columns if they were created with old VARCHAR(20) schema
        try { $pdo->exec("ALTER TABLE takatrack_loans MODIFY COLUMN give_date VARCHAR(35) NOT NULL"); } catch (PDOException) {}
        try { $pdo->exec("ALTER TABLE takatrack_loans MODIFY COLUMN due_date  VARCHAR(35) NOT NULL"); } catch (PDOException) {}

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS takatrack_stocks (
                id           VARCHAR(36)   PRIMARY KEY,
                name         VARCHAR(255)  NOT NULL,
                quantity     DECIMAL(15,4) DEFAULT 0,
                category     VARCHAR(50)   NOT NULL,
                sub_category VARCHAR(100)  NULL,
                last_updated VARCHAR(50)   NOT NULL,
                note         TEXT          NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS takatrack_my_debts (
                id               VARCHAR(36)   PRIMARY KEY,
                lender_name      VARCHAR(255)  NOT NULL,
                total_amount     DECIMAL(15,2) NOT NULL,
                remaining_amount DECIMAL(15,2) NOT NULL,
                date             VARCHAR(20)   NOT NULL,
                due_date         VARCHAR(20)   NULL,
                note             TEXT          NULL,
                payments         LONGTEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        return $pdo;

    } catch (PDOException $e) {
        http_response_code(503);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}

// ── File upload helper ────────────────────────────────────────────────────────
function uploadFile(array $file, string $subfolder = 'uploads'): ?string {
    if ($file['error'] !== UPLOAD_ERR_OK) return null;

    $uploadDir = dirname(__DIR__) . '/uploads/' . $subfolder . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $ext     = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!in_array($ext, $allowed)) return null;

    $filename = uniqid('img_', true) . '.' . $ext;
    $destPath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) return null;

    // Resize large images to max 1200px wide
    if (function_exists('imagecreatefromjpeg')) {
        _resizeImage($destPath, 1200);
    }

    return '/uploads/' . $subfolder . '/' . $filename;
}

function _resizeImage(string $path, int $maxWidth): void {
    try {
        $info = @getimagesize($path);
        if (!$info || $info[0] <= $maxWidth) return;

        [$w, $h] = $info;
        $newW = $maxWidth;
        $newH = (int)($h * $maxWidth / $w);
        $mime = $info['mime'];

        $src = match($mime) {
            'image/jpeg' => @imagecreatefromjpeg($path),
            'image/png'  => @imagecreatefrompng($path),
            'image/webp' => @imagecreatefromwebp($path),
            'image/gif'  => @imagecreatefromgif($path),
            default      => null,
        };
        if (!$src) return;

        $dst = imagecreatetruecolor($newW, $newH);
        if ($mime === 'image/png') {
            imagecolortransparent($dst, imagecolorallocatealpha($dst, 0, 0, 0, 127));
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
        }
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $w, $h);

        match($mime) {
            'image/jpeg' => imagejpeg($dst, $path, 85),
            'image/png'  => imagepng($dst, $path, 6),
            'image/webp' => imagewebp($dst, $path, 85),
            'image/gif'  => imagegif($dst, $path),
            default      => null,
        };

        imagedestroy($src);
        imagedestroy($dst);
    } catch (Throwable) {}
}

// Delete a file uploaded via uploadFile()
function deleteUploadedFile(?string $url): void {
    if (!$url || !str_starts_with($url, '/uploads/')) return;
    $path = dirname(__DIR__) . $url;
    if (file_exists($path)) @unlink($path);
}
