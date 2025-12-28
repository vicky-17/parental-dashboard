// models\Device.js

const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    
    // Core Identity
    name: { type: String, default: "My Child's Phone" },
    pairingCode: { type: String }, 
    isPaired: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    hardwareId: { type: String }, // Optional: Unique Android ID

    // GLOBAL SETTINGS (Stored directly on the Device document)
    locationInterval: { type: Number, default: 60000 },   // Default 1 min
    appSyncInterval: { type: Number, default: 300000 },   // Default 5 mins
    lastModified: { type: Number, default: () => Date.now() }
});

module.exports = mongoose.models.Device || mongoose.model('Device', DeviceSchema);



