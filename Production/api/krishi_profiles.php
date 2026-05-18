<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $profiles = [];
    foreach ($db->query("SELECT * FROM krishi_profiles ORDER BY created_at DESC")->fetchAll() as $row) {
        $profiles[] = [
            'id'           => $row['id'],
            'name'         => $row['name'],
            'startDate'    => $row['start_date'],
            'landSize'     => $row['land_size'],
            'active'       => (bool)$row['active'],
            'status'       => $row['status'],
            'type'         => $row['type'],
            'archivedDate' => $row['archived_date'],
            'expectedSale' => (float)$row['expected_sale'],
            'actualSale'   => (float)$row['actual_sale'],
            'expenses'     => json_decode($row['expenses']    ?: '[]', true),
            'sales'        => json_decode($row['sales']       ?: '[]', true),
            'stocks'       => json_decode($row['stocks']      ?: '[]', true),
            'stockSales'   => json_decode($row['stock_sales'] ?: '[]', true),
        ];
    }
    echo json_encode($profiles);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create a new profile
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['id']) || empty($data['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: id, name']);
        exit;
    }
    $stmt = $db->prepare("
        INSERT INTO krishi_profiles
            (id, name, start_date, land_size, active, status, type, archived_date,
             expected_sale, actual_sale, expenses, sales, stocks, stock_sales, created_at)
        VALUES
            (:id, :name, :startDate, :landSize, :active, :status, :type, :archivedDate,
             :expectedSale, :actualSale, :expenses, :sales, :stocks, :stockSales, :createdAt)
    ");
    $stmt->execute([
        ':id'           => $data['id'],
        ':name'         => $data['name'],
        ':startDate'    => $data['startDate']    ?? date('Y-m-d'),
        ':landSize'     => $data['landSize']     ?? null,
        ':active'       => ($data['active'] ?? true) ? 1 : 0,
        ':status'       => $data['status']       ?? 'live',
        ':type'         => $data['type']         ?? 'cultivation',
        ':archivedDate' => $data['archivedDate'] ?? null,
        ':expectedSale' => (float)($data['expectedSale'] ?? 0),
        ':actualSale'   => (float)($data['actualSale']   ?? 0),
        ':expenses'     => json_encode($data['expenses']   ?? []),
        ':sales'        => json_encode($data['sales']      ?? []),
        ':stocks'       => json_encode($data['stocks']     ?? []),
        ':stockSales'   => json_encode($data['stockSales'] ?? []),
        ':createdAt'    => date('c'),
    ]);
    http_response_code(201);
    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update a single profile by ?id=
    $id   = $_GET['id'] ?? '';
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }

    $stmt = $db->prepare("
        UPDATE krishi_profiles SET
            name          = :name,
            start_date    = :startDate,
            land_size     = :landSize,
            active        = :active,
            status        = :status,
            type          = :type,
            archived_date = :archivedDate,
            expected_sale = :expectedSale,
            actual_sale   = :actualSale,
            expenses      = :expenses,
            sales         = :sales,
            stocks        = :stocks,
            stock_sales   = :stockSales
        WHERE id = :id
    ");
    $stmt->execute([
        ':id'           => $id,
        ':name'         => $data['name'],
        ':startDate'    => $data['startDate']    ?? date('Y-m-d'),
        ':landSize'     => $data['landSize']     ?? null,
        ':active'       => ($data['active'] ?? true) ? 1 : 0,
        ':status'       => $data['status']       ?? 'live',
        ':type'         => $data['type']         ?? 'cultivation',
        ':archivedDate' => $data['archivedDate'] ?? null,
        ':expectedSale' => (float)($data['expectedSale'] ?? 0),
        ':actualSale'   => (float)($data['actualSale']   ?? 0),
        ':expenses'     => json_encode($data['expenses']   ?? []),
        ':sales'        => json_encode($data['sales']      ?? []),
        ':stocks'       => json_encode($data['stocks']     ?? []),
        ':stockSales'   => json_encode($data['stockSales'] ?? []),
    ]);
    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
    $db->prepare("DELETE FROM krishi_profiles WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
