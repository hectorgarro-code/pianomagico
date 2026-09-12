CREATE DATABASE IF NOT EXISTS pianomagicoweb;
USE pianomagicoweb;

-- Table for authentication/selection
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profile linked to user
CREATE TABLE IF NOT EXISTS user_profile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) DEFAULT 'NUEVO MÚSICO',
    avatar_id INT DEFAULT 1,
    total_score INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Stickers linked to user
CREATE TABLE IF NOT EXISTS user_stickers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sticker_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Medals linked to user
CREATE TABLE IF NOT EXISTS user_medals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    song_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Songs (either global or user-created)
CREATE TABLE IF NOT EXISTS songs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL, -- NULL if it's a default lesson
    title VARCHAR(255) NOT NULL,
    sequence TEXT NOT NULL,
    sticker_id INT DEFAULT 1,
    speed INT DEFAULT 800,
    rhythm VARCHAR(50) DEFAULT 'pop',
    is_user_created BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Recorded performances / audios
CREATE TABLE IF NOT EXISTS user_performances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    song_id INT NOT NULL,
    log_data TEXT NOT NULL, -- JSON with the performance log
    score INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
