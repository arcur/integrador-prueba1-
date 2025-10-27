<?php
// Start a session to potentially store login status later
session_start();

// --- Database Connection Details ---
// !!! IMPORTANT: Replace with your actual database credentials !!!
$dbHost = 'localhost'; // Usually localhost
$dbUser = 'root';      // Your MySQL username
$dbPass = 'mj123456789';          // Your MySQL password (leave blank if none)
$dbName = 'techstore_db'; // Your database name

// --- Response Headers ---
header('Content-Type: application/json'); // Tell the browser we're sending JSON

// --- 1. Establish Database Connection ---
// --- 1. Establish Database Connection ---
$conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName, 3307); // <-- Añadido el puerto 3307
// Check for connection errors
if ($conn->connect_error) {
    // Send a generic error message (don't expose specific DB errors)
    echo json_encode(['success' => false, 'message' => 'Error de conexión. Intente más tarde.']);
    exit(); // Stop script execution
}

// Set character set to UTF-8
$conn->set_charset("utf8");

// --- 2. Get Data from Frontend (POST request) ---
// Use filter_input for basic sanitization
$username = filter_input(INPUT_POST, 'username', FILTER_SANITIZE_SPECIAL_CHARS);
$password = filter_input(INPUT_POST, 'password'); // Password doesn't need sanitization here

// Basic validation: ensure data was received
if (!$username || !$password) {
    echo json_encode(['success' => false, 'message' => 'Usuario y contraseña son requeridos.']);
    $conn->close();
    exit();
}

// --- 3. Prepare and Execute SQL Query ---
// Select user based on 'usuario' column (use prepared statements!)
$sql = "SELECT id_usuario, contraseña, nombre, apellido_paterno FROM usuario WHERE usuario = ? AND id_estado = 1"; // Assuming id_estado 1 is 'Activo'

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    // Error preparing statement (log this error on the server)
    error_log("Error preparing statement: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor.']);
    $conn->close();
    exit();
}

// Bind the username parameter (s = string)
$stmt->bind_param("s", $username);

// Execute the statement
$stmt->execute();

// Get the result
$result = $stmt->get_result();

// --- 4. Verify User and Password ---
if ($result->num_rows === 1) {
    // User found, fetch their data
    $user = $result->fetch_assoc();
    $storedHashedPassword = $user['contraseña'];

    // !!! CRUCIAL: Verify the provided password against the stored hash !!!
    // Use password_verify()
    if (password_verify($password, $storedHashedPassword)) {
        // Password is CORRECT!
        
        // Store user info in session (optional, for subsequent pages)
        $_SESSION['user_id'] = $user['id_usuario'];
        $_SESSION['user_name'] = $user['nombre'] . ' ' . $user['apellido_paterno'];
        
        // Send success response
        echo json_encode([
            'success' => true, 
            'userName' => $_SESSION['user_name'] // Send user's name back
        ]);

    } else {
        // Password is INCORRECT
        echo json_encode(['success' => false, 'message' => 'Usuario o contraseña incorrectos.']);
    }

} else {
    // User NOT found or is inactive
    echo json_encode(['success' => false, 'message' => 'Usuario o contraseña incorrectos.']);
}

// --- 5. Close Connections ---
$stmt->close();
$conn->close();

?>