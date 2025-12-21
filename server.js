const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Certificate Schema
const certificateSchema = new mongoose.Schema({
    studentName: String,
    registerId: String,
    certName: String,
    issueDate: String,
    issuerName: String,
    fileHash: { type: String, unique: true },
    timestamp: { type: Number, default: Date.now }
});

const Certificate = mongoose.model('Certificate', certificateSchema);

// API Routes
app.post('/api/certificates', async (req, res) => {
    try {
        const { fileHash } = req.body;
        const existing = await Certificate.findOne({ fileHash });
        if (existing) {
            return res.status(400).json({ message: 'Certificate already registered' });
        }
        const newCert = new Certificate(req.body);
        await newCert.save();
        res.status(201).json({ message: 'Certificate recorded successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/certificates/:hash', async (req, res) => {
    try {
        const cert = await Certificate.findOne({ fileHash: req.params.hash });
        if (cert) {
            const { fileHash, ...details } = cert._doc;
            res.json(details);
        } else {
            res.status(404).json({ message: 'Certificate not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Catch-all route for SPA
app.get('(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
