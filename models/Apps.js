// models\Apps.js

const mongoose = require('mongoose');

const AppRuleSchema = new mongoose.Schema({
    // Foreign Key: Links to the Device
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    
    packageName: { type: String, required: true }, // e.g., "com.instagram.android"
    appName: { type: String, default: "Unknown" },

    installed : {type: Boolean, default: false},
    lastopened : { type: Number, default: () => Date.now() }, //date with time

    // The Rules
    isLocked: { type: Boolean, default: false },
    dailyLimit: { type: Number, default: 0 }, // 0 = Unlimited

    // Multiple Schedules (Array)
    schedules: [{
        enabled: { type: Boolean, default: true },
        startTime: { type: String, default: "21:00" }, // 24h format
        endTime: { type: String, default: "07:00" },
        days: [Number] // Optional: 0=Sun, 1=Mon... (For future use)
    }]
});

// PERFORMANCE INDEX:
// Ensures unique rule per app per device + Instant lookup
AppRuleSchema.index({ deviceId: 1, packageName: 1 }, { unique: true });

module.exports = mongoose.models.AppRule || mongoose.model('AppRule', AppRuleSchema);

