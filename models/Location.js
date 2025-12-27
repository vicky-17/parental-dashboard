const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    latitude: Number,
    longitude: Number,
    batteryLevel: Number,
    timestamp: { type: Date, default: Date.now, index: true }, // Indexed for history queries
    
    // Optional: Array of apps used in that time window
    appUsage: [{ name: String, duration: String }]
});

module.exports = mongoose.models.Location || mongoose.model('Location', LocationSchema);