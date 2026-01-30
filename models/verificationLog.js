/**
 * Audit log for verifications - used by secure view and analytics.
 * Tracks every verification attempt (success, tampered, revoked) for metrics and audit.
 */
const mongoose = require('mongoose');

const verificationLogSchema = new mongoose.Schema({
    certificateHash: { type: String, required: true, index: true },
    result: { type: String, required: true, enum: ['VERIFIED', 'TAMPERED', 'REVOKED', 'ERROR'] },
    verifierIp: { type: String, default: null },
    userAgent: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
    // For analytics: count verifications and fake attempts
    isFakeAttempt: { type: Boolean, default: false }
}, { timestamps: false });

verificationLogSchema.index({ timestamp: -1 });
verificationLogSchema.index({ result: 1, timestamp: -1 });

const VerificationLog = mongoose.model('VerificationLog', verificationLogSchema);

module.exports = { VerificationLog };
