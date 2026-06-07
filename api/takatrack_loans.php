<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
$db = getDB();

function rowToLoan(array $r): array {
    return [
        'id'              => $r['id'],
        'borrowerId'      => $r['borrower_id'],
        'amount'          => (float)$r['amount'],
        'remainingAmount' => (float)$r['remaining_amount'],
        'category'        => $r['category'],
        'reason'          => $r['reason'],
        'giveDate'        => $r['give_date'],
        'dueDate'         => $r['due_date'],
        'status'          => $r['status'],
        'notes'           => $r['notes'],
        'payments'        => json_decode($r['payments'] ?: '[]', true),
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $loans = array_map('rowToLoan', $db->query("SELECT * FROM takatrack_loans ORDER BY give_date DESC")->fetchAll());
    echo json_encode($loans);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $d = json_decode(file_get_contents('php://input'), true);
    $db->prepare("INSERT INTO takatrack_loans (id, borrower_id, amount, remaining_amount, category, reason, give_date, due_date, status, notes, payments) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
       ->execute([$d['id'], $d['borrowerId'], (float)$d['amount'], (float)($d['remainingAmount'] ?? $d['amount']), $d['category'], $d['reason'] ?? null, $d['giveDate'], $d['dueDate'], $d['status'], $d['notes'] ?? null, json_encode($d['payments'] ?? [])]);
    http_response_code(201);
    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id = $_GET['id'] ?? '';
    $d  = json_decode(file_get_contents('php://input'), true);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
    $db->prepare("UPDATE takatrack_loans SET remaining_amount=?, status=?, payments=? WHERE id=?")
       ->execute([(float)$d['remainingAmount'], $d['status'], json_encode($d['payments'] ?? []), $id]);
    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
    $db->prepare("DELETE FROM takatrack_loans WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
