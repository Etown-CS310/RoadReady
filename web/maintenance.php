<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: ../processes/login.php');
    exit;
}

require_once __DIR__ . '/../includes/config.php';

$userId = (int)$_SESSION['user_id'];
$vehicleId = isset($_GET['vehicle_id']) ? (int)$_GET['vehicle_id'] : 0;
$message = '';
$error = '';

$vehicles = [];
$stmt = $conn->prepare(
    'SELECT v.id, v.make, v.model, v.model_year, v.current_mileage
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

/*
 * Add a scheduled maintenance item.
 * Authorization is established above by requiring the vehicle to belong
 * to the current user's user_vehicles relationship.
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'add_schedule') {
    $postedVehicleId = (int)($_POST['vehicle_id'] ?? 0);
    $maintenanceTypeId = (int)($_POST['maintenance_type_id'] ?? 0);
    $dueMileage = trim($_POST['due_mileage'] ?? '');
    $dueDate = trim($_POST['due_date'] ?? '');
    $notes = trim($_POST['notes'] ?? '');

    $authorized = false;
    foreach ($vehicles as $v) {
        if ((int)$v['id'] === $postedVehicleId) {
            $authorized = true;
            break;
        }
    }

    if (!$authorized) {
        $error = 'You are not authorized to modify that vehicle.';
    } elseif ($maintenanceTypeId <= 0) {
        $error = 'Please select a maintenance type.';
    } elseif ($dueMileage === '' && $dueDate === '') {
        $error = 'Enter a due mileage, due date, or both.';
    } else {
        $dueMileageValue = $dueMileage === '' ? null : (int)$dueMileage;
        $dueDateValue = $dueDate === '' ? null : $dueDate;

        $status = 'good';
        if ($dueMileageValue !== null && $vehicle && $dueMileageValue <= (int)$vehicle['current_mileage']) {
            $status = 'overdue';
        }

        if ($dueDateValue !== null && $dueDateValue < date('Y-m-d')) {
            $status = 'overdue';
        }

        $stmt = $conn->prepare(
            'INSERT INTO vehicle_maintenance_schedule
             (vehicle_id, maintenance_type_id, due_mileage, due_date, status, notes)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->bind_param(
            'iiisss',
            $postedVehicleId,
            $maintenanceTypeId,
            $dueMileageValue,
            $dueDateValue,
            $status,
            $notes
        );

        if ($stmt->execute()) {
            $message = 'Maintenance schedule item added.';
            $vehicleId = $postedVehicleId;
            $vehicle = null;
            foreach ($vehicles as $v) {
                if ((int)$v['id'] === $vehicleId) {
                    $vehicle = $v;
                    break;
                }
            }
        } else {
            $error = 'Unable to add the maintenance item.';
        }
        $stmt->close();
    }
}

$types = [];
$result = $conn->query(
    'SELECT id, name, default_interval_miles, default_interval_months
     FROM maintenance_types
     ORDER BY name'
);
while ($row = $result->fetch_assoc()) {
    $types[] = $row;
}

$schedule = [];
$history = [];

if ($vehicle) {
    $stmt = $conn->prepare(
        'SELECT s.id, mt.name, s.due_mileage, s.due_date, s.status, s.notes
         FROM vehicle_maintenance_schedule s
         INNER JOIN maintenance_types mt ON mt.id = s.maintenance_type_id
         WHERE s.vehicle_id = ?
         ORDER BY
           CASE WHEN s.status = "overdue" THEN 0
                WHEN s.status = "soon" THEN 1
                WHEN s.status = "good" THEN 2
                ELSE 3 END,
           s.due_date,
           s.due_mileage'
    );
    $stmt->bind_param('i', $vehicleId);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $schedule[] = $row;
    }
    $stmt->close();

    $stmt = $conn->prepare(
        'SELECT h.id, h.service_date, mt.name, h.mileage_at_service,
                h.cost_cents, h.shop_name, h.notes
         FROM maintenance_history h
         INNER JOIN maintenance_types mt ON mt.id = h.maintenance_type_id
         WHERE h.vehicle_id = ?
         ORDER BY h.service_date DESC, h.id DESC'
    );
    $stmt->bind_param('i', $vehicleId);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $history[] = $row;
    }
    $stmt->close();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance | RoadReady</title>
    <link rel="stylesheet" href="../includes/styles.css">
</head>
<body>
<?php require __DIR__ . '/../includes/navbar.php'; ?>

<main class="main">
    <div class="topbar">
        <div>
            <h1>Maintenance</h1>
            <p>Track upcoming service and completed maintenance.</p>
        </div>
        <div class="profile">👤 <?= htmlspecialchars($_SESSION['full_name']) ?></div>
    </div>

    <?php if ($message): ?>
        <div class="alert success"><?= htmlspecialchars($message) ?></div>
    <?php endif; ?>
    <?php if ($error): ?>
        <div class="alert error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <?php if (!$vehicles): ?>
        <section class="panel empty-state">
            <h2>No vehicles available</h2>
            <p>Add or share a vehicle with this account before recording maintenance.</p>
        </section>
    <?php else: ?>
        <form class="vehicle-selector" method="get">
            <label for="vehicle_id">Vehicle</label>
            <select name="vehicle_id" id="vehicle_id" onchange="this.form.submit()">
                <?php foreach ($vehicles as $v): ?>
                    <option value="<?= (int)$v['id'] ?>" <?= ((int)$v['id'] === $vehicleId) ? 'selected' : '' ?>>
                        <?= htmlspecialchars($v['model_year'] . ' ' . $v['make'] . ' ' . $v['model']) ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </form>

        <?php if ($vehicle): ?>
            <section class="content-grid maintenance-layout">
                <div class="panel">
                    <div class="panel-header">
                        <h2>Upcoming Maintenance</h2>
                    </div>

                    <?php if (!$schedule): ?>
                        <div class="empty-state-small">No scheduled maintenance.</div>
                    <?php else: ?>
                        <?php foreach ($schedule as $item): ?>
                            <div class="maintenance-item">
                                <div>
                                    <div class="service-name"><?= htmlspecialchars($item['name']) ?></div>
                                    <div class="service-detail">
                                        <?php if ($item['due_mileage'] !== null): ?>
                                            <?= number_format((int)$item['due_mileage']) ?> mi
                                        <?php endif; ?>
                                        <?php if ($item['due_date'] !== null): ?>
                                            <?= $item['due_mileage'] !== null ? ' • ' : '' ?>
                                            <?= date('M j, Y', strtotime($item['due_date'])) ?>
                                        <?php endif; ?>
                                        <?php if ($item['notes']): ?>
                                            <br><?= htmlspecialchars($item['notes']) ?>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                <span class="status <?= htmlspecialchars($item['status']) ?>">
                                    <?= strtoupper(htmlspecialchars($item['status'])) ?>
                                </span>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <div class="panel">
                    <div class="panel-header">
                        <h2>Add Maintenance</h2>
                    </div>

                    <form method="post" class="form-grid">
                        <input type="hidden" name="action" value="add_schedule">
                        <input type="hidden" name="vehicle_id" value="<?= (int)$vehicle['id'] ?>">

                        <label for="maintenance_type_id">Maintenance Type</label>
                        <select name="maintenance_type_id" id="maintenance_type_id" required>
                            <option value="">Select service</option>
                            <?php foreach ($types as $type): ?>
                                <option value="<?= (int)$type['id'] ?>">
                                    <?= htmlspecialchars($type['name']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>

                        <label for="due_mileage">Due Mileage</label>
                        <input type="number" name="due_mileage" id="due_mileage" min="0" placeholder="e.g. 145000">

                        <label for="due_date">Due Date</label>
                        <input type="date" name="due_date" id="due_date">

                        <label for="notes">Notes</label>
                        <textarea name="notes" id="notes" maxlength="255" rows="3"></textarea>

                        <button type="submit" class="button">Add Schedule Item</button>
                    </form>
                </div>
            </section>

            <section class="panel" style="margin-top:22px;">
                <div class="panel-header">
                    <h2>Maintenance History</h2>
                </div>

                <?php if (!$history): ?>
                    <div class="empty-state-small">No maintenance history yet.</div>
                <?php else: ?>
                    <div class="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Service</th>
                                    <th>Mileage</th>
                                    <th>Cost</th>
                                    <th>Shop</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                            <?php foreach ($history as $item): ?>
                                <tr>
                                    <td><?= date('M j, Y', strtotime($item['service_date'])) ?></td>
                                    <td><?= htmlspecialchars($item['name']) ?></td>
                                    <td><?= number_format((int)$item['mileage_at_service']) ?></td>
                                    <td>$<?= number_format(((int)$item['cost_cents']) / 100, 2) ?></td>
                                    <td><?= htmlspecialchars($item['shop_name'] ?: '—') ?></td>
                                    <td><?= htmlspecialchars($item['notes'] ?: '—') ?></td>
                                </tr>
                            <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </section>
        <?php endif; ?>
    <?php endif; ?>

    <?php require __DIR__ . '/../includes/footer.php'; ?>
</main>
</body>
</html>
