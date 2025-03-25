const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('./config.json');

const app = express();

// Create uploads directory if it doesn't exist
if (!fs.existsSync(config.uploadPath)) {
    fs.mkdirSync(config.uploadPath);
}

// Database initialization
const db = new sqlite3.Database(config.database, (err) => {
    if (err) console.error('Database connection error:', err);
    else console.log('Connected to database');
});

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT UNIQUE,
        theme TEXT DEFAULT 'light',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        filename TEXT,
        original_name TEXT,
        size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true
}));

// Set view engine
app.set('view engine', 'ejs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: config.uploadPath,
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: config.maxFileSize },
    fileFilter: (req, file, cb) => {
        if (config.allowedFileTypes.includes(file.mimetype)) {
            // Check video count for user
            db.get('SELECT COUNT(*) as count FROM videos WHERE user_id = ?', [req.session.userId], (err, row) => {
                if (err) {
                    cb(new Error('Database error'));
                } else if (row.count >= config.maxVideosPerUser) {
                    cb(new Error(`Maximum limit of ${config.maxVideosPerUser} videos reached`));
                } else {
                    cb(null, true);
                }
            });
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Routes
app.get('/', (req, res) => {
    res.render('index', { 
        user: req.session.userId,
        config: config
    });
});

app.get('/login', (req, res) => {
    res.render('login', { config });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            res.render('login', { error: 'Database error', config });
        } else if (!user) {
            res.render('login', { error: 'User not found', config });
        } else {
            bcrypt.compare(password, user.password, (err, match) => {
                if (match) {
                    req.session.userId = user.id;
                    req.session.theme = user.theme;
                    res.redirect('/dashboard');
                } else {
                    res.render('login', { error: 'Invalid password', config });
                }
            });
        }
    });
});

app.get('/register', (req, res) => {
    res.render('register', { config });
});

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            res.render('register', { error: 'Registration error', config });
        } else {
            db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, hash],
                (err) => {
                    if (err) {
                        res.render('register', { error: 'Username or email already exists', config });
                    } else {
                        res.redirect('/login');
                    }
                });
        }
    });
});

app.get('/dashboard', requireAuth, (req, res) => {
    db.all('SELECT * FROM videos WHERE user_id = ?', [req.session.userId], (err, videos) => {
        if (err) {
            res.render('dashboard', { error: 'Could not fetch videos', videos: [], config: config });
        } else {
            res.render('dashboard', { videos: videos, config: config });
        }
    });
});

app.post('/upload', requireAuth, upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    db.run('INSERT INTO videos (user_id, title, filename, original_name, size) VALUES (?, ?, ?, ?, ?)',
        [req.session.userId, req.body.title, req.file.filename, req.file.originalname, req.file.size],
        (err) => {
            if (err) {
                res.status(500).json({ error: 'Upload failed' });
            } else {
                res.json({ success: true });
            }
        });
});

app.post('/theme', requireAuth, (req, res) => {
    const { theme } = req.body;
    if (theme === 'light' || theme === 'dark') {
        db.run('UPDATE users SET theme = ? WHERE id = ?', [theme, req.session.userId], (err) => {
            if (err) {
                res.status(500).json({ error: 'Failed to update theme' });
            } else {
                req.session.theme = theme;
                res.json({ success: true });
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid theme' });
    }
});

app.get('/embed/:id', (req, res) => {
    db.get('SELECT * FROM videos WHERE id = ?', [req.params.id], (err, video) => {
        if (err || !video) {
            res.status(404).send('Video not found');
        } else {
            res.render('embed', { video: video, config: config });
        }
    });
});

app.get('/video/:filename', (req, res) => {
    const filePath = path.resolve(__dirname, config.uploadPath, req.params.filename);
    res.download(filePath); // Changed from sendFile to download for the download button
});

// Delete video
app.delete('/video/:id', requireAuth, (req, res) => {
    const videoId = req.params.id;
    
    db.get('SELECT * FROM videos WHERE id = ? AND user_id = ?', [videoId, req.session.userId], (err, video) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!video) {
            return res.status(404).json({ error: 'Video not found or unauthorized' });
        }

        const filePath = path.join(config.uploadPath, video.filename);
        fs.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                return res.status(500).json({ error: 'Failed to delete file' });
            }

            db.run('DELETE FROM videos WHERE id = ? AND user_id = ?', [videoId, req.session.userId], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to delete from database' });
                }
                res.json({ success: true });
            });
        });
    });
});

// Replace video
app.post('/video/:id/replace', requireAuth, upload.single('video'), (req, res) => {
    const videoId = req.params.id;
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    db.get('SELECT * FROM videos WHERE id = ? AND user_id = ?', [videoId, req.session.userId], (err, video) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!video) {
            return res.status(404).json({ error: 'Video not found or unauthorized' });
        }

        const oldFilePath = path.join(config.uploadPath, video.filename);
        fs.unlink(oldFilePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                return res.status(500).json({ error: 'Failed to delete old file' });
            }

            db.run('UPDATE videos SET filename = ?, original_name = ?, size = ? WHERE id = ? AND user_id = ?',
                [req.file.filename, req.file.originalname, req.file.size, videoId, req.session.userId],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to update database' });
                    }
                    res.json({ success: true });
                });
        });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Serve static files
app.use('/tringle-player', express.static('tringle-player'));
app.use('/uploads', express.static('uploads'));

// Start server
app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});