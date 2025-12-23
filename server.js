const express = require('express');
const sqlite3 = require('sqlite3').verbose(); // SQLite3を読み込む
const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.use(express.json());

const db = new sqlite3.Database('./my-database.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, role TEXT)");

    db.get("SELECT count(*) as count FROM users", (err, row) => {
        if (row.count === 0) {
            console.log("データベースが空なので、初期データを投入します...");
            const stmt = db.prepare("INSERT INTO users (name, role) VALUES (?, ?)");
            stmt.run("佐藤", "Engineer");
            stmt.run("鈴木", "Designer");
            stmt.run("高橋", "Manager");
            stmt.finalize();
        }
    });
});

app.get('/api/users', (req, res) => {
    db.all("SELECT * FROM users", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.json(rows);
    });
});

app.post('/api/users', (req, res) => {
    const { name, role } = req.body;

    if (!name || !role) {
        return res.status(400).json({ error: "Name and role are required. " });
    }

    const sql = `INSERT INTO users (name, role) VALUES (?, ?)`;
    db.run(sql, [name, role], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
            message: "User created successfully",
            id: this.lastID,
            name,
            role
        });
    });
});

app.listen(PORT, () => {
    console.log(`サーバー起動: http://localhost:${PORT}`);
});

app.put('/api/users/:id', (req, res) => {
    const id = req.params.id;
    const { name, role } = req.body;
    const sql = `UPDATE users SET name = ?, role = ? WHERE id = ?`;

    db.run(sql, [name, role, id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({
            message: "User updated successfully",
            data: { id, name, role }
        });
    });
});

app.delete('/api/users/:id', (req, res) => {
    const id = req.params.id;
    const sql = `DELETE FROM users WHERE id = ?`;

    db.run(sql, id, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "User not fonud" });
        }
        res.json({ message: "User deleted successfully" });
    });
});