<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $rows = $db->query("SELECT * FROM takatrack_borrowers ORDER BY rowid DESC")->fetchAll();
    $borrowers = array_map(fn($r) => [
        'id'        => $r['id'],
        'name'      => $r['name'],
        'phone'     => $r['phone'],
        'address'   => $r['address'],
        'photoUrl'  => $r['photo_url'],
        'nid'       => $r['nid'],
        'riskLevel' => $r['risk_level'],
    ], $rows);
    echo json_encode($borrowers);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $d = json_decode(file_get_contents('php://input'), true);
    $db->prepare("INSERT INTO takatrack_borrowers (id, name, phone, address, photo_url, nid, risk_level) VALUES (?,?,?,?,?,?,?)")
       ->execute([$d['id'], $d['name'], $d['phone'] ?? null, $d['address'] ?? null, $d['photoUrl'] ?? null, $d['nid'] ?? null, $d['riskLevel'] ?? 'Low']);
    http_response_code(201);
    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
    // Cascade: delete loans first
    $loanIds = $db->prepare("SELECT id FROM takatrack_loans WHERE borrower_id = ?")->execute([$id]) ? [] : [];
    $stmt = $db->prepare("SELECT id FROM takatrack_loans WHERE borrower_id = ?");
    $stmt->execute([$id]);
    $db->prepare("DELETE FROM takatrack_loans WHERE borrower_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM takatrack_borrowers WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
