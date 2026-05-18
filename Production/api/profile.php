<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
$db = getDB();

$id = $_GET['id'] ?? '';
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing profile ID']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['name'])) {
        $db->prepare("UPDATE profiles SET name = ? WHERE id = ?")
           ->execute([$data['name'], $id]);
    }

    if (isset($data['is_archived'])) {
        $db->prepare("UPDATE profiles SET is_archived = ?, archived_at = ? WHERE id = ?")
           ->execute([$data['is_archived'] ? 1 : 0, $data['archived_at'] ?? null, $id]);
    }

    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Collect cow IDs under this profile
    $stmt = $db->prepare("SELECT id FROM cows WHERE profile_id = ?");
    $stmt->execute([$id]);
    $cowIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Delete all transactions for those cows in one query
    if ($cowIds) {
        $placeholders = implode(',', array_fill(0, count($cowIds), '?'));
        $db->prepare("DELETE FROM transactions WHERE cow_id IN ($placeholders)")
           ->execute($cowIds);
    }

    $db->prepare("DELETE FROM cows WHERE profile_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM profiles WHERE id = ?")->execute([$id]);

    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
