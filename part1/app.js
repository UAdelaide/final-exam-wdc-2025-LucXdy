const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 8080;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

let database;

(async () => {
    try {
        // Setup initial connection to create the database
        const initialConnection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });

        await initialConnection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
        await initialConnection.end();

        // Connect to the DogWalkService database
        database = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'DogWalkService'
        });

        // Create tables
        await database.execute(`
            CREATE TABLE IF NOT EXISTS Users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('owner', 'walker') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await database.execute(`
            CREATE TABLE IF NOT EXISTS Dogs (
                dog_id INT AUTO_INCREMENT PRIMARY KEY,
                owner_id INT NOT NULL,
                name VARCHAR(50) NOT NULL,
                size ENUM('small', 'medium', 'large') NOT NULL,
                FOREIGN KEY (owner_id) REFERENCES Users(user_id)
            )
        `);

        await database.execute(`
            CREATE TABLE IF NOT EXISTS WalkRequests (
                request_id INT AUTO_INCREMENT PRIMARY KEY,
                dog_id INT NOT NULL,
                requested_time DATETIME NOT NULL,
                duration_minutes INT NOT NULL,
                location VARCHAR(255) NOT NULL,
                status ENUM('open', 'accepted', 'completed', 'cancelled') DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id)
            )
        `);

        await database.execute(`
            CREATE TABLE IF NOT EXISTS WalkRatings (
                rating_id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                walker_id INT NOT NULL,
                owner_id INT NOT NULL,
                rating INT CHECK (rating BETWEEN 1 AND 5),
                comments TEXT,
                rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
                FOREIGN KEY (walker_id) REFERENCES Users(user_id),
                FOREIGN KEY (owner_id) REFERENCES Users(user_id),
                UNIQUE (request_id)
            )
        `);

        app.get('/', (req, res) => {
            res.json({
                message: 'Dog Walking Service API',
                available_routes: [
                    '/api/dogs',
                    '/api/walkrequests/open',
                    '/api/walkers/summary'
                ]
            });
        });

        //1 
        app.get('/api/dogs', async (req, res) => {
            try {
                const [dogsList] = await database.execute(`
                    SELECT 
                        Dogs.name AS dog_name, 
                        Dogs.size, 
                        Users.username AS owner_username
                    FROM Dogs
                    JOIN Users ON Dogs.owner_id = Users.user_id
                `);
                res.json(dogsList);
            } catch (error) {
                res.status(500).json({ error: 'Could not get dog list' });
            }
        });

        //2
        app.get('/api/walkrequests/open', async (req, res) => {
            try {
                const [openWalks] = await database.execute(`
                    SELECT 
                        WalkRequests.request_id, 
                        Dogs.name AS dog_name, 
                        WalkRequests.requested_time, 
                        WalkRequests.duration_minutes,
                        WalkRequests.location, 
                        Users.username AS owner_username
                    FROM WalkRequests
                    JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id
                    JOIN Users ON Dogs.owner_id = Users.user_id
                    WHERE WalkRequests.status = 'open'
                `);
                res.json(openWalks);
            } catch (error) {
                res.status(500).json({ error: 'Could not get walk requests' });
            }
        });

        app.get('/api/walkers/summary', async (req, res) => {
            try {
                const [walkerSummaries] = await database.execute(`
                    SELECT 
                        u.username AS walker_username,
                        COUNT(r.rating_id) AS total_ratings,
                        ROUND(AVG(r.rating), 1) AS average_rating,
                        COUNT(w.request_id) AS completed_walks
                    FROM Users u
                    LEFT JOIN WalkRatings r ON u.user_id = r.walker_id
                    LEFT JOIN WalkRequests w ON w.request_id = r.request_id AND w.status = 'completed'
                    WHERE u.role = 'walker'
                    GROUP BY u.user_id
                `);
                res.json(walkerSummaries);
            } catch (error) {
                res.status(500).json({ error: 'Could not get walker summary' });
            }
        });

        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Error Message:', error.message);
    }
})();