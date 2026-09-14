<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: ../processes/login.php');
    exit;
}

require_once __DIR__ . '/../includes/config.php';

$articles = [];
$stmt = $conn->prepare(
    'SELECT a.id, a.maintenance_type_id, a.title, a.summary,
            a.body_markdown, a.risks_if_skipped, mt.name
     FROM maintenance_guide_articles a
     INNER JOIN maintenance_types mt ON mt.id = a.maintenance_type_id
     ORDER BY mt.name'
);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $articles[] = $row;
}
$stmt->close();

$selectedId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$selected = null;

foreach ($articles as $article) {
    if ((int)$article['id'] === $selectedId) {
        $selected = $article;
        break;
    }
}

if (!$selected && $articles) {
    $selected = $articles[0];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance Guide | RoadReady</title>
    <link rel="stylesheet" href="../includes/styles.css">
</head>
<body>
<?php require __DIR__ . '/../includes/navbar.php'; ?>

<main class="main">
    <div class="topbar">
        <div>
            <h1>Maintenance Guide</h1>
            <p>Learn why routine maintenance matters.</p>
        </div>
        <div class="profile">👤 <?= htmlspecialchars($_SESSION['full_name']) ?></div>
    </div>

    <?php if (!$articles): ?>
        <section class="panel empty-state">
            <h2>No guide articles</h2>
            <p>Maintenance guide content has not been added yet.</p>
        </section>
    <?php else: ?>
        <section class="guide-layout">
            <aside class="panel guide-sidebar">
                <h2>Topics</h2>
                <?php foreach ($articles as $article): ?>
                    <a class="guide-link <?= ($selected && (int)$selected['id'] === (int)$article['id']) ? 'selected' : '' ?>"
                       href="maintenance_guide.php?id=<?= (int)$article['id'] ?>">
                        <?= htmlspecialchars($article['name']) ?>
                    </a>
                <?php endforeach; ?>
            </aside>

            <?php if ($selected): ?>
                <article class="panel guide-article">
                    <span class="guide-category"><?= htmlspecialchars($selected['name']) ?></span>
                    <h2><?= htmlspecialchars($selected['title']) ?></h2>

                    <?php if ($selected['summary']): ?>
                        <p class="guide-summary"><?= htmlspecialchars($selected['summary']) ?></p>
                    <?php endif; ?>

                    <div class="guide-body">
                        <?= nl2br(htmlspecialchars($selected['body_markdown'], ENT_QUOTES, 'UTF-8')) ?>
                    </div>

                    <?php if ($selected['risks_if_skipped']): ?>
                        <div class="risk-box">
                            <h3>Risks if skipped</h3>
                            <p><?= nl2br(htmlspecialchars($selected['risks_if_skipped'], ENT_QUOTES, 'UTF-8')) ?></p>
                        </div>
                    <?php endif; ?>
                </article>
            <?php endif; ?>
        </section>
    <?php endif; ?>

    <?php require __DIR__ . '/../includes/footer.php'; ?>
</main>
</body>
</html>
