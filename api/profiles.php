<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->query("SELECT * FROM profiles ORDER BY created_at DESC");
    $profiles = [];
    foreach ($stmt->fetchAll() as $row) {
        $profiles[] = [
            'id'         => $row['id'],
            'name'       => $row['name'],
            'ownerUid'   => $row['owner_uid'],
            'photoUrl'   => $row['photo_url'] ?? null,
            'createdAt'  => $row['created_at'],
            'isArchived' => (bool)$row['is_archived'],
            'archivedAt' => $row['archived_at'],
        ];
    }
    echo json_encode($profiles);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Support both multipart (with photo) and JSON
    if (!empty($_FILES['photo']) || !empty($_POST['name'])) {
        // Multipart form data
        $data = [
            'id'        => $_POST['id']        ?? '',
            'name'      => $_POST['name']       ?? '',
            'ownerUid'  => $_POST['ownerUid']   ?? 'local-user',
            'createdAt' => $_POST['createdAt']  ?? date('c'),
        ];
    } else {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
    }

    if (empty($data['id']) || empty($data['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: id, name']);
        exit;
    }

    $photoUrl = null;
    if (!empty($_FILES['photo'])) {
        $photoUrl = uploadFile($_FILES['photo'], 'profiles');
    }

    $stmt = $db->prepare(
        "INSERT INTO profiles (id, name, owner_uid, photo_url, created_at)
         VALUES (:id, :name, :ownerUid, :photoUrl, :createdAt)"
    );
    $stmt->execute([
        ':id'        => $data['id'],
        ':name'      => $data['name'],
        ':ownerUid'  => $data['ownerUid']  ?? 'local-user',
        ':photoUrl'  => $photoUrl,
        ':createdAt' => $data['createdAt'] ?? date('c'),
    ]);

    http_response_code(201);
    echo json_encode(['success' => true, 'photoUrl' => $photoUrl]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
