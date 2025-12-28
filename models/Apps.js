// models/Apps.js
const mongoose = require('mongoose');

const AppRuleSchema = new mongoose.Schema({
    // Foreign Key: Links to the Device
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    
    packageName: { type: String, required: true }, 
    appName: { type: String, default: "Unknown" },

    installed: { type: Boolean, default: false },
    lastopened: { type: Number, default: () => Date.now() }, 

    // The Rules
    isLocked: { type: Boolean, default: false },
    dailyLimit: { type: Number, default: 0 }, // 0 = Unlimited minutes

    // Multiple Schedules
    schedules: [{
        enabled: { type: Boolean, default: true },
        startTime: { type: String, default: "21:00" }, // 24h format
        endTime: { type: String, default: "07:00" },
        days: { type: [Number], default: [0,1,2,3,4,5,6] } // 0=Sun, 1=Mon... Default all week
    }]
});

// Ensures unique rule per app per device + Instant lookup
AppRuleSchema.index({ deviceId: 1, packageName: 1 }, { unique: true });

module.exports = mongoose.models.AppRule || mongoose.model('AppRule', AppRuleSchema);