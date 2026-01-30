/**
 * Issuer reputation - one document per institution.
 * Updated on each certificate issue and on each verification (success/fake).
 */
const mongoose = require('mongoose');

const issuerSchema = new mongoose.Schema({
    institutionName: { type: String, required: true, unique: true, trim: true },
    trustScore: { type: Number, default: 100, min: 0, max: 100 },
    totalCertificatesIssued: { type: Number, default: 0 },
    tamperAttempts: { type: Number, default: 0 },
    lastAuditAt: { type: Date, default: Date.now }
}, { timestamps: true });

issuerSchema.index({ institutionName: 1 });
issuerSchema.index({ trustScore: -1 });

const Issuer = mongoose.model('Issuer', issuerSchema);

module.exports = { Issuer };
