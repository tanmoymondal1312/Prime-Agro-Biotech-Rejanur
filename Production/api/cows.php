<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Build transaction map indexed by cow_id
    $txMap = [];
    foreach ($db->query("SELECT * FROM transactions")->fetchAll() as $tx) {
        $txMap[$tx['cow_id']][] = [
            'id'     => $tx['id'],
            'type'   => $tx['type'],
            'amount' => (float)$tx['amount'],
            'date'   => $tx['date'],
            'note'   => $tx['note'],
        ];
    }

    $cows = [];
    foreach ($db->query("SELECT * FROM cows ORDER BY created_at DESC")->fetchAll() as $cow) {
        $cows[] = [
            'id'                 => $cow['id'],
            'tag'                => $cow['tag'],
            'category'           => $cow['category'],
            'profileId'          => $cow['profile_id'],
            'entryDate'          => $cow['entry_date'],
            'purchasePrice'      => (float)$cow['purchase_price'],
            'gender'             => $cow['gender'],
            'profitType'         => $cow['profit_type'],
            'address'            => $cow['address'],
            'additionalExpenses' => (float)$cow['additional_expenses'],
            'loanAmount'         => (float)$cow['loan_amount'],
            'treatmentCost'      => (float)$cow['treatment_cost'],
            'notes'              => $cow['notes'],
            'cowImageUrl'        => $cow['cow_image_url'],
            'receiptImageUrl'    => $cow['receipt_image_url'],
            'salePrice'          => $cow['sale_price'] !== null ? (float)$cow['sale_price'] : null,
            'isSold'             => (bool)$cow['is_sold'],
            'saleDate'           => $cow['sale_date'],
            'ownerUid'           => $cow['owner_uid'],
            'createdAt'          => $cow['created_at'],
            'history'            => $txMap[$cow['id']] ?? [],
        ];
    }

    echo json_encode($cows);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $cow = json_decode(file_get_contents('php://input'), true);

    if (empty($cow['id']) || empty($cow['category']) || empty($cow['profileId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: id, category, profileId']);
        exit;
    }

    $stmt = $db->prepare("
        INSERT INTO cows (
            id, tag, category, profile_id, entry_date, purchase_price, gender,
            profit_type, address, additional_expenses, loan_amount, treatment_cost,
            notes, cow_image_url, receipt_image_url, sale_price, is_sold, sale_date,
            owner_uid, created_at
        ) VALUES (
            :id, :tag, :category, :profileId, :entryDate, :purchasePrice, :gender,
            :profitType, :address, :additionalExpenses, :loanAmount, :treatmentCost,
            :notes, :cowImageUrl, :receiptImageUrl, :salePrice, :isSold, :saleDate,
            :ownerUid, :createdAt
        )
    ");

    $stmt->execute([
        ':id'                 => $cow['id'],
        ':tag'                => $cow['tag']   ?? null,
        ':category'           => $cow['category'],
        ':profileId'          => $cow['profileId'],
        ':entryDate'          => $cow['entryDate'],
        ':purchasePrice'      => (float)($cow['purchasePrice']      ?? 0),
        ':gender'             => $cow['gender'],
        ':profitType'         => $cow['profitType'],
        ':address'            => $cow['address'] ?? null,
        ':additionalExpenses' => (float)($cow['additionalExpenses'] ?? 0),
        ':loanAmount'         => (float)($cow['loanAmount']         ?? 0),
        ':treatmentCost'      => (float)($cow['treatmentCost']      ?? 0),
        ':notes'              => $cow['notes']           ?? null,
        ':cowImageUrl'        => $cow['cowImageUrl']     ?? null,
        ':receiptImageUrl'    => $cow['receiptImageUrl'] ?? null,
        ':salePrice'          => isset($cow['salePrice']) && $cow['salePrice'] !== '' ? (float)$cow['salePrice'] : null,
        ':isSold'             => $cow['isSold'] ? 1 : 0,
        ':saleDate'           => $cow['saleDate']  ?? null,
        ':ownerUid'           => $cow['ownerUid']  ?? 'local-user',
        ':createdAt'          => $cow['createdAt'] ?? date('c'),
    ]);

    // Insert transaction history
    if (!empty($cow['history'])) {
        $txStmt = $db->prepare(
            "INSERT INTO transactions (id, cow_id, type, amount, date, note)
             VALUES (:id, :cowId, :type, :amount, :date, :note)"
        );
        foreach ($cow['history'] as $tx) {
            $txStmt->execute([
                ':id'     => $tx['id'],
                ':cowId'  => $cow['id'],
                ':type'   => $tx['type'],
                ':amount' => (float)$tx['amount'],
                ':date'   => $tx['date'],
                ':note'   => $tx['note'] ?? null,
            ]);
        }
    }

    http_response_code(201);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
