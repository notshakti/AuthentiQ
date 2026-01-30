/**
 * Time-bound verification links. Token is single-use and expires.
 */
const mongoose = require('mongoose');
const crypto = require('crypto');

const verificationLinkSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true, index: true },
    certificateHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date, default: null }
}, { timestamps: true });

verificationLinkSchema.index({ expiresAt: 1 }); // TTL-style cleanup queries

const VerificationLink = mongoose.model('VerificationLink', verificationLinkSchema);

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = { VerificationLink, generateToken };
