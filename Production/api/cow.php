<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
$db = getDB();

$id = $_GET['id'] ?? '';
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing animal ID']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $cow = json_decode(file_get_contents('php://input'), true);

    $stmt = $db->prepare("
        UPDATE cows SET
            tag                 = :tag,
            category            = :category,
            profile_id          = :profileId,
            entry_date          = :entryDate,
            purchase_price      = :purchasePrice,
            gender              = :gender,
            profit_type         = :profitType,
            address             = :address,
            additional_expenses = :additionalExpenses,
            loan_amount         = :loanAmount,
            treatment_cost      = :treatmentCost,
            notes               = :notes,
            cow_image_url       = :cowImageUrl,
            receipt_image_url   = :receiptImageUrl,
            sale_price          = :salePrice,
            is_sold             = :isSold,
            sale_date           = :saleDate
        WHERE id = :id
    ");

    $stmt->execute([
        ':id'                 => $id,
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
        ':saleDate'           => $cow['saleDate'] ?? null,
    ]);

    // Sync transactions: delete old, insert updated list
    $db->prepare("DELETE FROM transactions WHERE cow_id = ?")->execute([$id]);

    if (!empty($cow['history'])) {
        $txStmt = $db->prepare(
            "INSERT INTO transactions (id, cow_id, type, amount, date, note)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        foreach ($cow['history'] as $tx) {
            $txStmt->execute([
                $tx['id'],
                $id,
                $tx['type'],
                (float)$tx['amount'],
                $tx['date'],
                $tx['note'] ?? null,
            ]);
        }
    }

    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $db->prepare("DELETE FROM cows WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
