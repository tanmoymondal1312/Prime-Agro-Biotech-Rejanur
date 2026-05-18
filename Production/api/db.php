<?php
function getDB(): PDO {
    // SQLite database file — stored inside api/ folder, protected by .htaccess
    $dbFile = __DIR__ . '/khamar.db';

    try {
        $pdo = new PDO("sqlite:$dbFile", null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);

        // Enable WAL mode for better concurrent access & enforce foreign keys
        $pdo->exec("PRAGMA journal_mode=WAL");
        $pdo->exec("PRAGMA foreign_keys=ON");

        // Auto-create tables on first run (no manual SQL import needed)
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS profiles (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                owner_uid   TEXT NOT NULL,
                created_at  TEXT NOT NULL,
                is_archived INTEGER DEFAULT 0,
                archived_at TEXT
            )
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS cows (
                id                  TEXT    PRIMARY KEY,
                tag                 TEXT,
                category            TEXT    NOT NULL,
                profile_id          TEXT    NOT NULL,
                entry_date          TEXT    NOT NULL,
                purchase_price      REAL    DEFAULT 0,
                gender              TEXT    NOT NULL,
                profit_type         TEXT    NOT NULL,
                address             TEXT,
                additional_expenses REAL    DEFAULT 0,
                loan_amount         REAL    DEFAULT 0,
                treatment_cost      REAL    DEFAULT 0,
                notes               TEXT,
                cow_image_url       TEXT,
                receipt_image_url   TEXT,
                sale_price          REAL,
                is_sold             INTEGER DEFAULT 0,
                sale_date           TEXT,
                owner_uid           TEXT    NOT NULL,
                created_at          TEXT,
                FOREIGN KEY (profile_id) REFERENCES profiles(id)
            )
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS transactions (
                id     TEXT PRIMARY KEY,
                cow_id TEXT NOT NULL,
                type   TEXT NOT NULL,
                amount REAL NOT NULL,
                date   TEXT NOT NULL,
                note   TEXT,
                FOREIGN KEY (cow_id) REFERENCES cows(id) ON DELETE CASCADE
            )
        ");

        // ── Pro1: সমন্বিত কৃষি ট্রেড ──────────────────────────────────────
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS krishi_profiles (
                id            TEXT PRIMARY KEY,
                name          TEXT NOT NULL,
                start_date    TEXT NOT NULL,
                land_size     TEXT,
                active        INTEGER DEFAULT 1,
                status        TEXT DEFAULT 'live',
                type          TEXT DEFAULT 'cultivation',
                archived_date TEXT,
                expected_sale REAL DEFAULT 0,
                actual_sale   REAL DEFAULT 0,
                expenses      TEXT DEFAULT '[]',
                sales         TEXT DEFAULT '[]',
                stocks        TEXT DEFAULT '[]',
                stock_sales   TEXT DEFAULT '[]',
                created_at    TEXT NOT NULL
            )
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS krishi_weather_logs (
                id         TEXT PRIMARY KEY,
                date       TEXT NOT NULL,
                comment    TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS krishi_farm_plans (
                id         TEXT PRIMARY KEY,
                date       TEXT NOT NULL,
                end_date   TEXT,
                activity   TEXT NOT NULL,
                color      TEXT,
                status     TEXT DEFAULT 'pending',
                created_at TEXT NOT NULL
            )
        ");

        // ── Pro2: দেনা পাওনার হিসাব ──────────────────────────────────────
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS takatrack_borrowers (
                id         TEXT PRIMARY KEY,
                name       TEXT NOT NULL,
                phone      TEXT,
                address    TEXT,
                photo_url  TEXT,
                nid        TEXT,
                risk_level TEXT DEFAULT 'Low'
            )
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS takatrack_loans (
                id               TEXT PRIMARY KEY,
                borrower_id      TEXT NOT NULL,
                amount           REAL NOT NULL,
                remaining_amount REAL NOT NULL,
                category         TEXT NOT NULL,
                reason           TEXT,
                give_date        TEXT NOT NULL,
                due_date         TEXT NOT NULL,
                status           TEXT NOT NULL,
                notes            TEXT,
                payments         TEXT DEFAULT '[]',
                FOREIGN KEY (borrower_id) REFERENCES takatrack_borrowers(id) ON DELETE CASCADE
            )
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS takatrack_stocks (
                id           TEXT PRIMARY KEY,
                name         TEXT NOT NULL,
                quantity     REAL DEFAULT 0,
                category     TEXT NOT NULL,
                sub_category TEXT,
                last_updated TEXT NOT NULL,
                note         TEXT
            )
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS takatrack_my_debts (
                id               TEXT PRIMARY KEY,
                lender_name      TEXT NOT NULL,
                total_amount     REAL NOT NULL,
                remaining_amount REAL NOT NULL,
                date             TEXT NOT NULL,
                due_date         TEXT,
                note             TEXT,
                payments         TEXT DEFAULT '[]'
            )
        ");

        return $pdo;

    } catch (PDOException $e) {
        http_response_code(503);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}
