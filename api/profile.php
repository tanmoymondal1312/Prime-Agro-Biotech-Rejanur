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

if ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Support multipart (with photo) or JSON
    if (!empty($_FILES['photo']) || !empty($_POST['name'])) {
        $data = $_POST;
        // Remove _method override field
        unset($data['_method']);
    } else {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (isset($data['_method'])) unset($data['_method']);
    }

    if (isset($data['name'])) {
        $db->prepare("UPDATE profiles SET name = ? WHERE id = ?")
           ->execute([$data['name'], $id]);
    }

    if (isset($data['is_archived']) || isset($data['isArchived'])) {
        $archived   = (bool)($data['is_archived'] ?? $data['isArchived']);
        $archivedAt = $archived ? ($data['archived_at'] ?? $data['archivedAt'] ?? date('Y-m-d')) : null;
        $db->prepare("UPDATE profiles SET is_archived = ?, archived_at = ? WHERE id = ?")
           ->execute([$archived ? 1 : 0, $archivedAt, $id]);
    }

    if (!empty($_FILES['photo'])) {
        // Delete old photo
        $old = $db->prepare("SELECT photo_url FROM profiles WHERE id = ?");
        $old->execute([$id]);
        $row = $old->fetch();
        if ($row) deleteUploadedFile($row['photo_url']);

        $photoUrl = uploadFile($_FILES['photo'], 'profiles');
        if ($photoUrl) {
            $db->prepare("UPDATE profiles SET photo_url = ? WHERE id = ?")
               ->execute([$photoUrl, $id]);
        }
    }

    echo json_encode(['success' => true]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Collect cow IDs under this profile
    $stmt = $db->prepare("SELECT id, cow_image_url, receipt_image_url FROM cows WHERE profile_id = ?");
    $stmt->execute([$id]);
    $cowRows = $stmt->fetchAll();

    // Delete cow image files
    foreach ($cowRows as $cow) {
        deleteUploadedFile($cow['cow_image_url']);
        deleteUploadedFile($cow['receipt_image_url']);
    }

    // Delete all transactions for those cows
    if ($cowRows) {
        $cowIds       = array_column($cowRows, 'id');
        $placeholders = implode(',', array_fill(0, count($cowIds), '?'));
        $db->prepare("DELETE FROM transactions WHERE cow_id IN ($placeholders)")
           ->execute($cowIds);
    }

    // Delete profile photo
    $row = $db->prepare("SELECT photo_url FROM profiles WHERE id = ?");
    $row->execute([$id]);
    $profile = $row->fetch();
    if ($profile) deleteUploadedFile($profile['photo_url']);

    $db->prepare("DELETE FROM cows WHERE profile_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM profiles WHERE id = ?")->execute([$id]);

    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
