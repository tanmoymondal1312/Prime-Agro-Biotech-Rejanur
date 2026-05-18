<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$phone    = trim($input['phone']    ?? '');
$password = trim($input['password'] ?? '');

if ($phone === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Phone and password are required']);
    exit;
}

// Read credentials from api/.env
$envFile = __DIR__ . '/.env';
$expectedPhone    = '';
$expectedPassword = '';

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        [$key, $val] = explode('=', $line, 2);
        $key = trim($key);
        $val = trim($val, " \t\"'");
        if ($key === 'APP_PHONE')    $expectedPhone    = $val;
        if ($key === 'APP_PASSWORD') $expectedPassword = $val;
    }
}

if ($expectedPhone === '' || $expectedPassword === '') {
    http_response_code(503);
    echo json_encode(['error' => 'Server credentials not configured. Please create api/.env file.']);
    exit;
}

if ($phone === $expectedPhone && $password === $expectedPassword) {
    // Deterministic token — same credentials always produce the same token
    $token = hash('sha256', $phone . ':' . $password . ':reza-portal-2025');
    echo json_encode(['success' => true, 'token' => $token]);
} else {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'নম্বর বা পাসওয়ার্ড ভুল']);
}
