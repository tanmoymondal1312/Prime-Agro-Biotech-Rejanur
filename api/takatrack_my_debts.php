<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
$db = getDB();

function rowToDebt(array $r): array {
    return [
        'id'              => $r['id'],
        'lenderName'      => $r['lender_name'],
        'totalAmount'     => (float)$r['total_amount'],
        'remainingAmount' => (float)$r['remaining_amount'],
        'date'            => $r['date'],
        'dueDate'         => $r['due_date'],
        'note'            => $r['note'],
        'payments'        => json_decode($r['payments'] ?: '[]', true),
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $debts = array_map('rowToDebt', $db->query("SELECT * FROM takatrack_my_debts ORDER BY date DESC")->fetchAll());
    echo json_encode($debts);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $d = json_decode(file_get_contents('php://input'), true);
    $db->prepare("INSERT INTO takatrack_my_debts (id, lender_name, total_amount, remaining_amount, date, due_date, note, payments) VALUES (?,?,?,?,?,?,?,?)")
       ->execute([$d['id'], $d['lenderName'], (float)$d['totalAmount'], (float)($d['remainingAmount'] ?? $d['totalAmount']), $d['date'], $d['dueDate'] ?? null, $d['note'] ?? null, json_encode($d['payments'] ?? [])]);
    http_response_code(201);
    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id = $_GET['id'] ?? '';
    $d  = json_decode(file_get_contents('php://input'), true);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
    $db->prepare("UPDATE takatrack_my_debts SET remaining_amount=?, payments=?, note=?, due_date=? WHERE id=?")
       ->execute([(float)$d['remainingAmount'], json_encode($d['payments'] ?? []), $d['note'] ?? null, $d['dueDate'] ?? null, $id]);
    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
    $db->prepare("DELETE FROM takatrack_my_debts WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
