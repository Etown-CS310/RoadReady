<?php

// ========================================
// RoadReady Database Configuration
// ========================================

// Detect whether we are running XAMPP locally
$host = $_SERVER['HTTP_HOST'] ?? '';

if ($host === '127.0.0.1' || $host === 'localhost') {

    // XAMPP MySQL settings
    $servername = '127.0.0.1';
    $username   = 'root';
    $password   = '';
    $database   = 'roadready';

} else {

    // Hostinger MySQL settings
    $servername = "srv557.hstgr.io";
    $username = "u413142534_vossens";
    $password = "R>83lEIY3s?";
    $database = "u413142534_vossensdb";
}


// ========================================
// Create MySQL Connection
// ========================================

$conn = new mysqli(
    $servername,
    $username,
    $password,
    $database
);


// ========================================
// Check Connection
// ========================================

if ($conn->connect_error) {
    die(
        'RoadReady database connection failed: ' .
        $conn->connect_error
    );
}


// ========================================
// Character Set
// ========================================

$conn->set_charset('utf8mb4');

?>