CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY,
    passwordhash VARCHAR(255) NOT NULL
);


CREATE TABLE IF NOT EXISTS accounts (
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    sold DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (username),
    FOREIGN KEY (username) REFERENCES users(username)
);