require("dotenv").config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

const certificateSchema = new mongoose.Schema({
    hash: { 
        type: String, 
        required: true, 
        unique: true,
        index: true,
        validate: {
            validator: function(v) {
                return typeof v === 'string' && v.length === 64 && /^[a-f0-9]{64}$/i.test(v);
            },
            message: 'Hash must be exactly 64 hexadecimal characters'
        }
    },
    studentName: String,
    registerNumber: String,
    certificateName: String,
    institution: String,
    issueDate: String,
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: false
});

const Certificate = mongoose.model('Certificate', certificateSchema);

function validateHash(hash) {
    if (!hash || typeof hash !== 'string') {
        return { valid: false, error: 'Hash must be a non-empty string' };
    }
    
    const trimmed = hash.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, error: 'Hash cannot be empty' };
    }
    
    if (trimmed.length !== 64) {
        return { valid: false, error: 'Hash must be exactly 64 characters' };
    }
    
    if (!/^[a-f0-9]{64}$/i.test(trimmed)) {
        return { valid: false, error: 'Hash must contain only hexadecimal characters' };
    }
    
    return { valid: true, hash: trimmed };
}

function sendVerifyResponse(res, payload) {
    if (!payload || typeof payload.status !== "string") {
        console.error("❌ Invalid response payload:", payload);
        payload = {
            status: "ERROR",
            message: "Invalid verification response from server"
        };
    }
    
    console.log("FINAL VERIFY RESPONSE:", JSON.stringify(payload, null, 2));
    return res.status(200).json(payload);
}

app.get('/api/health', (req, res) => {
    try {
        const mongoStatus = mongoose.connection.readyState === 1 ? "CONNECTED" : "DISCONNECTED";
        res.json({
            status: "OK",
            mongo: mongoStatus
        });
    } catch (err) {
        res.json({
            status: "OK",
            mongo: "DISCONNECTED"
        });
    }
});

app.post('/api/certificates', async (req, res) => {
    try {
        const { fileHash, studentName, registerId, certName, issueDate, issuerName } = req.body;
        
        console.log('📥 Certificate upload request received');
        console.log('📥 Request data:', {
            studentName: studentName || 'N/A',
            registerId: registerId || 'N/A',
            certName: certName || 'N/A',
            issuerName: issuerName || 'N/A',
            issueDate: issueDate || 'N/A',
            fileHash: fileHash ? `${fileHash.substring(0, 16)}...` : 'MISSING'
        });
        
        if (!fileHash) {
            console.log('❌ Hash is missing');
            return res.status(400).json({ message: 'Hash is required' });
        }

        const hashValidation = validateHash(fileHash);
        if (!hashValidation.valid) {
            console.log('❌ Hash validation failed:', hashValidation.error);
            return res.status(400).json({ message: hashValidation.error });
        }

        const validHash = hashValidation.hash;
        console.log('🔍 Checking for existing certificate with hash:', validHash.substring(0, 16) + '...');

        const existing = await Certificate.findOne({ hash: validHash });
        if (existing) {
            console.log('⚠️ Certificate already exists:', {
                studentName: existing.studentName,
                registerNumber: existing.registerNumber,
                certificateName: existing.certificateName,
                createdAt: existing.createdAt
            });
            return res.status(400).json({ message: 'Certificate already registered' });
        }

        console.log('✅ No existing certificate found, creating new one...');
        console.log('📝 Creating certificate with hash:', validHash);
        console.log('📝 Hash type:', typeof validHash);
        console.log('📝 Hash length:', validHash ? validHash.length : 'NULL');
        
        const newCert = new Certificate({
            hash: validHash,
            studentName: studentName || '',
            registerNumber: registerId || '',
            certificateName: certName || '',
            institution: issuerName || '',
            issueDate: issueDate || '',
            createdAt: new Date()
        });

        // Validate before saving
        const validationError = newCert.validateSync();
        if (validationError) {
            console.error('❌ Validation error before save:', validationError);
            return res.status(400).json({ message: 'Validation failed: ' + validationError.message });
        }

        console.log('📝 Certificate object before save:', {
            hash: newCert.hash ? `${newCert.hash.substring(0, 16)}...` : 'NULL',
            studentName: newCert.studentName,
            registerNumber: newCert.registerNumber
        });

        await newCert.save();
        console.log('✅ Certificate saved successfully:', {
            hash: validHash.substring(0, 16) + '...',
            studentName: newCert.studentName,
            registerNumber: newCert.registerNumber
        });
        
        // Verify it was saved by querying the database
        const savedCert = await Certificate.findOne({ hash: validHash });
        if (savedCert) {
            console.log('✅ Verified: Certificate exists in database');
        } else {
            console.error('❌ ERROR: Certificate was not found after save!');
        }
        
        res.status(201).json({ message: 'Certificate recorded successfully' });
    } catch (err) {
        if (err.code === 11000) {
            console.log('⚠️ Duplicate key error (MongoDB unique constraint)');
            console.log('⚠️ Error details:', {
                code: err.code,
                keyPattern: err.keyPattern,
                keyValue: err.keyValue,
                message: err.message
            });
            
            // If the error shows fileHash instead of hash, there's an index mismatch
            if (err.keyValue && 'fileHash' in err.keyValue) {
                console.error('❌ CRITICAL: MongoDB index mismatch! Database has index on "fileHash" but schema uses "hash"');
                console.error('❌ You need to drop the old "fileHash" index from MongoDB');
                return res.status(500).json({ 
                    message: 'Database configuration error: Please contact administrator to fix index mismatch' 
                });
            }
            
            return res.status(400).json({ message: 'Certificate already registered' });
        }
        console.error('❌ Error issuing certificate:', err);
        console.error('❌ Error stack:', err.stack);
        res.status(500).json({ message: err.message || 'Internal server error' });
    }
});

app.post('/api/verify', async (req, res) => {
    console.log('📥 Incoming verification request');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    
    try {
        const { hash } = req.body;
        
        console.log('📥 Received hash:', hash ? `${hash.substring(0, 16)}...` : 'MISSING');
        
        if (!hash || typeof hash !== 'string' || hash.trim().length === 0) {
            console.log('❌ Hash validation failed');
            return sendVerifyResponse(res, {
                status: "ERROR",
                message: "Hash is required"
            });
        }

        const hashValidation = validateHash(hash);
        if (!hashValidation.valid) {
            return sendVerifyResponse(res, {
                status: "ERROR",
                message: hashValidation.error
            });
        }

        const validHash = hashValidation.hash;

        if (mongoose.connection.readyState !== 1) {
            console.log('❌ MongoDB not connected');
            return sendVerifyResponse(res, {
                status: "ERROR",
                message: "Database unavailable"
            });
        }

        let cert;
        try {
            console.log('🔍 Querying MongoDB for hash:', validHash.substring(0, 16) + '...');
            cert = await Certificate.findOne({ hash: validHash });
            console.log('🔍 DB query result:', cert ? 'FOUND' : 'NOT FOUND');
        } catch (dbError) {
            console.error('❌ Database query error:', dbError);
            return sendVerifyResponse(res, {
                status: "ERROR",
                message: "Database query failed"
            });
        }
        
        if (cert) {
            console.log('✅ Certificate found:', {
                studentName: cert.studentName,
                certificateName: cert.certificateName
            });
            
            return sendVerifyResponse(res, {
                status: "VERIFIED",
                certificate: {
                    studentName: cert.studentName || "N/A",
                    registerNumber: cert.registerNumber || "N/A",
                    certificateName: cert.certificateName || "N/A",
                    institution: cert.institution || "N/A",
                    issueDate: cert.issueDate || "N/A",
                    hash: cert.hash,
                    createdAt: cert.createdAt ? cert.createdAt.toISOString() : new Date().toISOString()
                }
            });
        }
        
        console.log('⚠️ Certificate not found in database');
        return sendVerifyResponse(res, {
            status: "TAMPERED",
            message: "Certificate hash not found"
        });
        
    } catch (err) {
        console.error('❌ Verification error:', err);
        return sendVerifyResponse(res, {
            status: "ERROR",
            message: "Internal server error"
        });
    }
    
    return sendVerifyResponse(res, {
        status: "ERROR",
        message: "Unreachable verification state"
    });
});

// Serve static files - check if dist exists (production) or use root (development)
const fs = require('fs');
const distPath = path.join(__dirname, 'dist');
const indexPath = fs.existsSync(distPath) 
    ? path.join(__dirname, 'dist', 'index.html')
    : path.join(__dirname, 'index.html');

if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
} else {
    // Development mode: serve from root
    app.use(express.static(__dirname));
}

app.get(/.*/, (req, res) => {
    res.sendFile(indexPath);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
