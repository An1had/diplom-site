const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статика: всі файли з папки public
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));
app.use(express.static(path.join(__dirname, 'public')));


// База даних
const db = new sqlite3.Database("./database.db");

// Створення таблиць при старті
db.run(`
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    date TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    message TEXT,
    date TEXT
)
`);

// --- API для новин ---
app.get("/api/news-test", (req, res) => {
    db.all("SELECT * FROM news ORDER BY id DESC", [], (err, rows) => {
        if(err) return res.status(500).send(err.message);
        res.json(rows);
    });
});

app.post("/api/news", (req, res) => {
    const { title, content, date } = req.body;
    if(!title || !content || !date) return res.status(400).json({ error: "Заповніть всі поля" });
    db.run(
        "INSERT INTO news (title, content, date) VALUES (?, ?, ?)",
        [title, content, date],
        function(err) {
            if(err) return res.status(500).json({ error: err.message });
            res.json({ message: "Новина додана", id: this.lastID });
        }
    );
});

// --- API для контактів ---
app.post("/api/feedback", (req, res) => {
    const { name, email, message } = req.body;
    const date = new Date().toISOString().split("T")[0];
    if(!name || !email || !message) return res.status(400).json({ error: "Заповніть всі поля" });
    db.run(
        "INSERT INTO feedback (name, email, message, date) VALUES (?, ?, ?, ?)",
        [name, email, message, date],
        function(err) {
            if(err) return res.status(500).json({ error: err.message });
            res.json({ message: "Повідомлення надіслано", id: this.lastID });
        }
    );
});

app.get("/api/feedback-test", (req, res) => {
    db.all("SELECT * FROM feedback ORDER BY id DESC", [], (err, rows) => {
        if(err) return res.status(500).send(err.message);
        res.json(rows);
    });
});

// --- fallback для всіх HTML сторінок ---
app.get("/:page", (req, res) => {
    const page = req.params.page;
    const filePath = path.join(publicPath, page);
    res.sendFile(filePath, err => {
        if(err) res.status(404).send("Сторінка не знайдена");
    });
});

// --- старт сервера ---
app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
});
// Видалення новини
app.delete("/api/news/:id", (req, res) => {
    const id = Number(req.params.id); // ⬅ примусово число

    if (!id) {
        return res.status(400).json({ error: "Некоректний ID" });
    }

    db.run(
        "DELETE FROM news WHERE id = ?",
        [id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: "Новину не знайдено" });
            }

            res.json({ message: "Новину успішно видалено" });
        }
    );
});

