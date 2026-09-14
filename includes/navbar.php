<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

if (!isset($_SESSION['user_id'])) {
    header('Location: ../processes/login.php');
    exit;
}

$currentPage = basename($_SERVER['PHP_SELF']);
$userName = $_SESSION['full_name'] ?? 'User';

function navActive(string $page): string {
    global $currentPage;
    return $currentPage === $page ? ' active' : '';
}
?>
<aside class="sidebar">
    <div class="logo">
        🚗 Road<span>Ready</span>
    </div>

    <nav class="main-nav">
        <a href="dashboard.php" class="nav-item<?= navActive('dashboard.php') ?>">
            <span class="nav-icon">▦</span> Dashboard
        </a>

        <a href="maintenance.php" class="nav-item<?= navActive('maintenance.php') ?>">
            <span class="nav-icon">🔧</span> Maintenance
        </a>

        <a href="vehicle.php" class="nav-item<?= navActive('vehicle.php') ?>">
            <span class="nav-icon">🚘</span> My Vehicle
        </a>

        <a href="maintenance_guide.php" class="nav-item<?= navActive('maintenance_guide.php') ?>">
            <span class="nav-icon">📖</span> Maintenance Guide
        </a>
    </nav>

    <div class="sidebar-bottom">
        <div class="sidebar-user">👤 <?= htmlspecialchars($userName, ENT_QUOTES, 'UTF-8') ?></div>
        <a href="../processes/logout.php" class="nav-item logout-link">
            <span class="nav-icon">↪</span> Log Out
        </a>
    </div>
</aside>
