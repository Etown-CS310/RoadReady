<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: ../processes/login.php');
    exit;
}

require_once __DIR__ . '/../includes/config.php';

$userId = (int)$_SESSION['user_id'];
$vehicleId = isset($_GET['vehicle_id']) ? (int)$_GET['vehicle_id'] : 0;

$vehicles = [];
$stmt = $conn->prepare(
    'SELECT v.*
     FROM vehicles v
     INNER JOIN user_vehicles uv ON uv.vehicle_id = v.id
     WHERE uv.user_id = ?
     ORDER BY v.id'
);
$stmt->bind_param('i', $userId);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $vehicles[] = $row;
}
$stmt->close();

if ($vehicleId <= 0 && $vehicles) {
    $vehicleId = (int)$vehicles[0]['id'];
}

$vehicle = null;
foreach ($vehicles as $v) {
    if ((int)$v['id'] === $vehicleId) {
        $vehicle = $v;
        break;
    }
}

if ($vehicleId > 0 && !$vehicle) {
    http_response_code(403);
    die('You do not have access to this vehicle.');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Vehicle | RoadReady</title>
    <link rel="stylesheet" href="../includes/styles.css">
</head>
<body>
<?php require __DIR__ . '/../includes/navbar.php'; ?>

<main class="main">
    <div class="topbar">
        <div>
            <h1>My Vehicle</h1>
            <p>Vehicles you own or have been given access to.</p>
        </div>
        <div class="profile">👤 <?= htmlspecialchars($_SESSION['full_name']) ?></div>
    </div>

    <?php if (!$vehicles): ?>
        <section class="panel empty-state">
            <h2>No vehicles available</h2>
            <p>Your account is not currently connected to any vehicles.</p>
        </section>
    <?php else: ?>
        <?php if (count($vehicles) > 1): ?>
            <div class="vehicle-list">
                <?php foreach ($vehicles as $v): ?>
                    <a class="vehicle-list-card <?= ((int)$v['id'] === $vehicleId) ? 'selected' : '' ?>"
                       href="vehicle.php?vehicle_id=<?= (int)$v['id'] ?>">
                        <strong><?= htmlspecialchars($v['model_year'] . ' ' . $v['make'] . ' ' . $v['model']) ?></strong>
                        <span><?= htmlspecialchars($v['nickname'] ?: ($v['trim'] ?: 'Vehicle')) ?></span>
                        <small><?= number_format((int)$v['current_mileage']) ?> miles</small>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <?php if ($vehicle): ?>
            <section class="vehicle-detail-card">
                <div class="vehicle-detail-header">
                    <div>
                        <h2><?= htmlspecialchars($vehicle['model_year'] . ' ' . $vehicle['make'] . ' ' . $vehicle['model']) ?></h2>
                        <?php if ($vehicle['nickname']): ?>
                            <p class="vehicle-nickname"><?= htmlspecialchars($vehicle['nickname']) ?></p>
                        <?php endif; ?>
                    </div>
                    <span class="mileage"><?= number_format((int)$vehicle['current_mileage']) ?> mi</span>
                </div>

                <div class="detail-grid">
                    <div><span>VIN</span><strong><?= htmlspecialchars($vehicle['vin'] ?: 'Not provided') ?></strong></div>
                    <div><span>Trim</span><strong><?= htmlspecialchars($vehicle['trim'] ?: 'Not provided') ?></strong></div>
                    <div><span>Engine</span><strong><?= htmlspecialchars($vehicle['engine'] ?: 'Not provided') ?></strong></div>
                    <div><span>Transmission</span><strong><?= htmlspecialchars($vehicle['transmission'] ?: 'Not provided') ?></strong></div>
                    <div><span>Body Type</span><strong><?= htmlspecialchars($vehicle['body_type'] ?: 'Not provided') ?></strong></div>
                </div>
            </section>
        <?php endif; ?>
    <?php endif; ?>

    <?php require __DIR__ . '/../includes/footer.php'; ?>
</main>
</body>
</html>
