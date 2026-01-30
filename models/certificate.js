/**
 * Certificate model - extended with lifecycle and revocation.
 * Existing fields (hash, studentName, registerNumber, etc.) are unchanged for backward compatibility.
 */
const mongoose = require('mongoose');

const LIFECYCLE_STATUS = Object.freeze({
    ISSUED: 'ISSUED',
    VERIFIED: 'VERIFIED',
    REVOKED: 'REVOKED',
    REISSUED: 'REISSUED'
});

const lifecycleEventSchema = new mongoose.Schema({
    status: { type: String, required: true, enum: Object.values(LIFECYCLE_STATUS) },
    timestamp: { type: Date, default: Date.now },
    meta: { type: mongoose.Schema.Types.Mixed } // e.g. verifierIp, linkToken
}, { _id: false });

const certificateSchema = new mongoose.Schema({
    hash: {
        type: String,
        required: true,
        unique: true,
        index: true,
        validate: {
            validator: function (v) {
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
    createdAt: { type: Date, default: Date.now },

    // Revocation (optional for backward compatibility)
    revoked: { type: Boolean, default: false },
    revokedReason: { type: String, default: null },
    revokedAt: { type: Date, default: null },

    // Immutable lifecycle log; every verification appends an event
    lifecycleEvents: {
        type: [lifecycleEventSchema],
        default: []
    }
}, {
    timestamps: false
});

// Index for analytics: find revoked certs and by institution
certificateSchema.index({ revoked: 1 });
certificateSchema.index({ institution: 1 });

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = { Certificate, LIFECYCLE_STATUS };
