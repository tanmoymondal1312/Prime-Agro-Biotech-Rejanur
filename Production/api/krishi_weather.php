<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $logs = [];
    foreach ($db->query("SELECT * FROM krishi_weather_logs ORDER BY created_at DESC")->fetchAll() as $row) {
        $logs[] = ['id' => $row['id'], 'date' => $row['date'], 'comment' => $row['comment']];
    }
    echo json_encode($logs);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $db->prepare("INSERT INTO krishi_weather_logs (id, date, comment, created_at) VALUES (?, ?, ?, ?)")
       ->execute([$data['id'], $data['date'], $data['comment'], date('c')]);
    http_response_code(201);
    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
    $db->prepare("DELETE FROM krishi_weather_logs WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
