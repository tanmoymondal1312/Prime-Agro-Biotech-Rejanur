<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $plans = [];
    foreach ($db->query("SELECT * FROM krishi_farm_plans ORDER BY created_at DESC")->fetchAll() as $row) {
        $plans[] = [
            'id'       => $row['id'],
            'date'     => $row['date'],
            'endDate'  => $row['end_date'],
            'activity' => $row['activity'],
            'color'    => $row['color'],
            'status'   => $row['status'],
        ];
    }
    echo json_encode($plans);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $db->prepare("INSERT INTO krishi_farm_plans (id, date, end_date, activity, color, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
       ->execute([$data['id'], $data['date'], $data['endDate'] ?? null, $data['activity'], $data['color'] ?? null, $data['status'] ?? 'pending', date('c')]);
    http_response_code(201);
    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id   = $_GET['id'] ?? '';
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
    $db->prepare("UPDATE krishi_farm_plans SET status = ? WHERE id = ?")
       ->execute([$data['status'], $id]);
    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
    $db->prepare("DELETE FROM krishi_farm_plans WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
