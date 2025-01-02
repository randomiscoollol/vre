// backend.js (Handles saving names, displaying leaderboard, and table creation)

import { Client } from 'pg';

export default async function handler(req, res) {
    const client = new Client({
        connectionString: process.env.DATABASE_URL, // Your Neon database connection string here
    });

    await client.connect();

    // Create the 'users' table if it doesn't exist
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                points INT DEFAULT 0
            )
        `);
    } catch (error) {
        console.error('Error creating table:', error);
        res.status(500).json({ success: false, message: 'Error creating table' });
        await client.end();
        return;
    }

    if (req.method === 'POST') {
        // Handle POST request to save the name
        const { name } = req.body;

        try {
            await client.query('INSERT INTO users (name, points) VALUES ($1, 0)', [name]);
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error inserting name:', error);
            res.status(500).json({ success: false, message: 'Error saving name' });
        }
    } else if (req.method === 'GET' && req.query.leaderboard === 'true') {
        // Handle GET request to fetch leaderboard
        try {
            const result = await client.query('SELECT * FROM users ORDER BY points DESC LIMIT 10');
            const leaderboard = result.rows.map((row, index) => ({
                rank: index + 1,
                name: row.name,
                points: row.points,
            }));

            res.status(200).json(leaderboard);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            res.status(500).json({ success: false, message: 'Error fetching leaderboard' });
        }
    } else {
        res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    await client.end();
}
