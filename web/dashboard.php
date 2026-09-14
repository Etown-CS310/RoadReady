<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: ../processes/login.php');
    exit;
}

require_once __DIR__ . '/../includes/config.php';

$userId = (int)$_SESSION['user_id'];
$userName = $_SESSION['full_name'] ?? 'User';
$selectedVehicleId = isset($_GET['vehicle_id']) ? (int)$_GET['vehicle_id'] : 0;

$vehicles = [];
$stmt = $conn->prepare(
    'SELECT v.id, v.nickname, v.make, v.model, v.model_year, v.trim,
            v.engine, v.transmission, v.body_type, v.current_mileage, v.image_url
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

if (!$vehicles) {
    $vehicle = null;
} else {
    $vehicle = $vehicles[0];
    if ($selectedVehicleId > 0) {
        foreach ($vehicles as $candidate) {
            if ((int)$candidate['id'] === $selectedVehicleId) {
                $vehicle = $candidate;
                break;
            }
        }
    }
}

$stats = [
    'next_service' => ['number' => 'N/A', 'sub' => 'No scheduled service'],
    'year' => ['number' => '$0.00', 'sub' => '0 services completed'],
    'status' => ['number' => 'Good', 'sub' => 'No overdue maintenance']
];

$upcoming = [];
$history = [];

if ($vehicle) {
    $vehicleId = (int)$vehicle['id'];

    $stmt = $conn->prepare(
        'SELECT s.id, mt.name, s.due_mileage, s.due_date, s.status, s.notes
         FROM vehicle_maintenance_schedule s
         INNER JOIN maintenance_types mt ON mt.id = s.maintenance_type_id
         WHERE s.vehicle_id = ? AND s.status <> "completed"
         ORDER BY
            CASE WHEN s.due_date IS NULL THEN 1 ELSE 0 END,
            s.due_date,
            CASE WHEN s.due_mileage IS NULL THEN 1 ELSE 0 END,
            s.due_mileage
         LIMIT 5'
    );
    $stmt->bind_param('i', $vehicleId);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $upcoming[] = $row;
    }
    $stmt->close();

    $stmt = $conn->prepare(
        'SELECT h.service_date, mt.name, h.mileage_at_service, h.cost_cents, h.shop_name
         FROM maintenance_history h
         INNER JOIN maintenance_types mt ON mt.id = h.maintenance_type_id
         WHERE h.vehicle_id = ?
         ORDER BY h.service_date DESC, h.id DESC
         LIMIT 5'
    );
    $stmt->bind_param('i', $vehicleId);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $history[] = $row;
    }
    $stmt->close();

    $stmt = $conn->prepare(
        'SELECT next_due_mileage
         FROM vehicle_next_service
         WHERE vehicle_id = ?
         LIMIT 1'
    );
    $stmt->bind_param('i', $vehicleId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($row && $row['next_due_mileage'] !== null) {
        $miles = (int)$row['next_due_mileage'] - (int)$vehicle['current_mileage'];
        $stats['next_service']['number'] = number_format(max(0, $miles)) . ' mi';
        $stats['next_service']['sub'] = 'Next scheduled service';
    }

    $stmt = $conn->prepare(
        'SELECT services_completed, total_cost_cents
         FROM vehicle_maintenance_this_year
         WHERE vehicle_id = ?
         LIMIT 1'
    );
    $stmt->bind_param('i', $vehicleId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($row) {
        $stats['year']['number'] = '$' . number_format(((int)$row['total_cost_cents']) / 100, 2);
        $stats['year']['sub'] = (int)$row['services_completed'] . ' services completed';
    }

    $stmt = $conn->prepare(
        'SELECT overall_status
         FROM vehicle_status
         WHERE vehicle_id = ?
         LIMIT 1'
    );
    $stmt->bind_param('i', $vehicleId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($row) {
        $status = strtolower($row['overall_status']);
        $stats['status']['number'] = ucfirst($status);
        $stats['status']['sub'] = $status === 'overdue'
            ? 'Maintenance needs attention'
            : ($status === 'soon' ? 'Maintenance due soon' : 'No overdue maintenance');
    }
}

function dashboardStatusLabel(string $status): string {
    return match ($status) {
        'soon' => 'DUE SOON',
        'overdue' => 'OVERDUE',
        default => 'UPCOMING'
    };
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard | RoadReady</title>
    <link rel="stylesheet" href="../includes/styles.css">
</head>
<body>
<?php require __DIR__ . '/../includes/navbar.php'; ?>

<main class="main">
    <div class="topbar">
        <div>
            <h1>Dashboard</h1>
            <p>Here's the current status of your vehicle.</p>
        </div>
        <div class="profile">👤 <?= htmlspecialchars($userName, ENT_QUOTES, 'UTF-8') ?></div>
    </div>

    <?php if (!$vehicle): ?>
        <section class="panel empty-state">
            <h2>No vehicles yet</h2>
            <p>Your account does not currently have access to a vehicle.</p>
        </section>
    <?php else: ?>
        <section class="vehicle-card">
            <div class="vehicle-info">
                <h2>
                    <?= htmlspecialchars($vehicle['model_year'] . ' ' . $vehicle['make'] . ' ' . $vehicle['model'], ENT_QUOTES, 'UTF-8') ?>
                </h2>
                <p>
                    <?= htmlspecialchars($vehicle['engine'] ?? '', ENT_QUOTES, 'UTF-8') ?>
                    &nbsp; • &nbsp;
                    <?= htmlspecialchars($vehicle['transmission'] ?? '', ENT_QUOTES, 'UTF-8') ?>
                    &nbsp; • &nbsp;
                    <?= htmlspecialchars($vehicle['body_type'] ?? '', ENT_QUOTES, 'UTF-8') ?>
                </p>
                <span class="mileage">
                    Current Mileage: <?= number_format((int)$vehicle['current_mileage']) ?> mi
                </span>
            </div>

            <div class="car-image">
                <?php if (!empty($vehicle['image_url'])): ?>
                    <img src="<?= htmlspecialchars($vehicle['image_url'], ENT_QUOTES, 'UTF-8') ?>"
                         alt="<?= htmlspecialchars($vehicle['make'] . ' ' . $vehicle['model'], ENT_QUOTES, 'UTF-8') ?>">
                <?php else: ?>
                    🚘 No vehicle image
                <?php endif; ?>
            </div>
        </section>

        <?php if (count($vehicles) > 1): ?>
            <form class="vehicle-selector" method="get">
                <label for="vehicle_id">Viewing vehicle</label>
                <select name="vehicle_id" id="vehicle_id" onchange="this.form.submit()">
                    <?php foreach ($vehicles as $v): ?>
                        <option value="<?= (int)$v['id'] ?>" <?= ((int)$v['id'] === (int)$vehicle['id']) ? 'selected' : '' ?>>
                            <?= htmlspecialchars($v['model_year'] . ' ' . $v['make'] . ' ' . $v['model'], ENT_QUOTES, 'UTF-8') ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </form>
        <?php endif; ?>

        <section class="stats">
            <div class="stat-card">
                <div class="stat-label">NEXT SERVICE</div>
                <div class="stat-number"><?= htmlspecialchars($stats['next_service']['number']) ?></div>
                <div class="stat-sub"><?= htmlspecialchars($stats['next_service']['sub']) ?></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">MAINTENANCE THIS YEAR</div>
                <div class="stat-number"><?= htmlspecialchars($stats['year']['number']) ?></div>
                <div class="stat-sub"><?= htmlspecialchars($stats['year']['sub']) ?></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">VEHICLE STATUS</div>
                <div class="stat-number"><?= htmlspecialchars($stats['status']['number']) ?></div>
                <div class="stat-sub"><?= htmlspecialchars($stats['status']['sub']) ?></div>
            </div>
        </section>

        <section class="content-grid">
            <div class="panel">
                <div class="panel-header">
                    <h2>Upcoming Maintenance</h2>
                    <a href="maintenance.php?vehicle_id=<?= (int)$vehicle['id'] ?>" class="view-link">View all</a>
                </div>

                <?php if (!$upcoming): ?>
                    <div class="empty-state-small">No upcoming maintenance.</div>
                <?php else: ?>
                    <?php foreach ($upcoming as $item): ?>
                        <div class="maintenance-item">
                            <div>
                                <div class="service-name"><?= htmlspecialchars($item['name']) ?></div>
                                <div class="service-detail">
                                    <?php if ($item['due_mileage'] !== null): ?>
                                        Due at <?= number_format((int)$item['due_mileage']) ?> miles
                                    <?php endif; ?>
                                    <?php if ($item['due_date'] !== null): ?>
                                        <?= $item['due_mileage'] !== null ? ' • ' : '' ?>
                                        <?= date('M j, Y', strtotime($item['due_date'])) ?>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <span class="status <?= htmlspecialchars($item['status']) ?>">
                                <?= dashboardStatusLabel($item['status']) ?>
                            </span>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>

                <div style="margin-top:20px;">
                    <a href="maintenance.php?vehicle_id=<?= (int)$vehicle['id'] ?>" class="button">+ Add Maintenance</a>
                </div>
            </div>

            <div class="panel">
                <div class="panel-header">
                    <h2>Recent History</h2>
                    <a href="maintenance.php?vehicle_id=<?= (int)$vehicle['id'] ?>&tab=history" class="view-link">View all</a>
                </div>

                <?php if (!$history): ?>
                    <div class="empty-state-small">No maintenance history yet.</div>
                <?php else: ?>
                    <table>
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Mileage</th>
                                <th>Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                        <?php foreach ($history as $row): ?>
                            <tr>
                                <td><?= htmlspecialchars($row['name']) ?></td>
                                <td><?= number_format((int)$row['mileage_at_service']) ?></td>
                                <td>$<?= number_format(((int)$row['cost_cents']) / 100, 2) ?></td>
                            </tr>
                        <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php endif; ?>
            </div>
        </section>
    <?php endif; ?>

    <?php require __DIR__ . '/../includes/footer.php'; ?>
</main>
</body>
</html>
