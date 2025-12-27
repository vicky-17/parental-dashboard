const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!mongoose.connection.readyState) {
    mongoose.connect(MONGODB_URI);
}

// Schema for Parent Settings
const SettingsSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    locationInterval: { type: Number, default: 60000 }, // Default 1 min (in ms)
    lastModified: { type: Number, default: Date.now }
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

module.exports = async (req, res) => {
    const { deviceId } = req.query;

    if (!deviceId) return res.status(400).json({ error: "Device ID required" });

    if (req.method === 'POST') {
        // Update Settings (Called from Parent Dashboard)
        const { locationInterval } = req.body;
        const updated = await Settings.findOneAndUpdate(
            { deviceId },
            { locationInterval, lastModified: Date.now() },
            { upsert: true, new: true }
        );
        res.status(200).json(updated);
    } else {
        // GET Settings (Called from Child App)
        let settings = await Settings.findOne({ deviceId });
        
        // Create default if not exists
        if (!settings) {
            settings = await Settings.create({ deviceId, locationInterval: 60000, lastModified: Date.now() });
        }
        res.status(200).json(settings);
    }
};