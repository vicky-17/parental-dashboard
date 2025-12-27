const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to Parent
    name: { type: String, default: "My Child's Phone" },
    
    // Pairing Logic
    pairingCode: { type: String }, // The 6-digit code (temporary)
    isPaired: { type: Boolean, default: false },
    
    // Settings specific to THIS phone
    settings: {
        locationInterval: { type: Number, default: 60000 },
        isAppBlockingEnabled: { type: Boolean, default: false }
    },

    lastSeen: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Device || mongoose.model('Device', DeviceSchema);