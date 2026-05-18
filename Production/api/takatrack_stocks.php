<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
$db = getDB();

function rowToStock(array $r): array {
    return [
        'id'          => $r['id'],
        'name'        => $r['name'],
        'quantity'    => (float)$r['quantity'],
        'category'    => $r['category'],
        'subCategory' => $r['sub_category'],
        'lastUpdated' => $r['last_updated'],
        'note'        => $r['note'],
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stocks = array_map('rowToStock', $db->query("SELECT * FROM takatrack_stocks ORDER BY rowid ASC")->fetchAll());
    echo json_encode($stocks);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create new stock item
    $d = json_decode(file_get_contents('php://input'), true);
    $db->prepare("INSERT INTO takatrack_stocks (id, name, quantity, category, sub_category, last_updated, note) VALUES (?,?,?,?,?,?,?)")
       ->execute([$d['id'], $d['name'], (float)($d['quantity'] ?? 0), $d['category'], $d['subCategory'] ?? null, $d['lastUpdated'] ?? date('c'), $d['note'] ?? null]);
    http_response_code(201);
    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update one stock item by ?id=
    $id = $_GET['id'] ?? '';
    $d  = json_decode(file_get_contents('php://input'), true);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
    $db->prepare("UPDATE takatrack_stocks SET quantity=?, note=?, last_updated=? WHERE id=?")
       ->execute([(float)($d['quantity'] ?? 0), $d['note'] ?? null, date('c'), $id]);
    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
    $db->prepare("DELETE FROM takatrack_stocks WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
