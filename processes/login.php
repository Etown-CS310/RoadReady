<?php
session_start();

if (isset($_SESSION['user_id'])) {
    header('Location: ../web/dashboard.php');
    exit;
}

require_once __DIR__ . '/../includes/config.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($email === '' || $password === '') {
        $error = 'Please enter your email and password.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Please enter a valid email address.';
    } else {
        $stmt = $conn->prepare(
            'SELECT id, email, password_hash, full_name, avatar_url
             FROM users
             WHERE email = ?
             LIMIT 1'
        );

        if ($stmt) {
            $stmt->bind_param('s', $email);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            $stmt->close();

            $hashedPassword = hash('sha256', $password);

            if ($user && hash_equals($user['password_hash'], $hashedPassword)) {
                session_regenerate_id(true);

                $_SESSION['user_id'] = (int)$user['id'];
                $_SESSION['email'] = $user['email'];
                $_SESSION['full_name'] = $user['full_name'];
                $_SESSION['avatar_url'] = $user['avatar_url'];

                header('Location: ../web/dashboard.php');
                exit;
            }

            $error = 'Invalid email or password.';
        } else {
            $error = 'Unable to process login right now.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | RoadReady</title>
    <link rel="stylesheet" href="../includes/styles.css">
</head>
<body class="auth-page">
    <main class="auth-container">
        <section class="auth-card">
            <div class="auth-logo">🚗 Road<span>Ready</span></div>
            <h1>Welcome back</h1>
            <p class="auth-subtitle">Sign in to manage your vehicles and maintenance.</p>

            <?php if ($error !== ''): ?>
                <div class="alert error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
            <?php endif; ?>

            <form method="post" action="login.php" class="auth-form">
                <label for="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value="<?= htmlspecialchars($_POST['email'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
                    autocomplete="email"
                    required
                >

                <label for="password">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    autocomplete="current-password"
                    required
                >

                <button type="submit" class="button auth-button">Sign In</button>
            </form>
        </section>
    </main>
</body>
</html>
