const mongoose = require('mongoose');
const dbConnect = require('./db'); // Import our new helper

// --- 1. PERFECT SCHEMA ---
const SettingsSchema = new mongoose.Schema({
    deviceId: { 
        type: String, 
        required: [true, "Device ID is required"], 
        unique: true,
        trim: true,
        index: true // Faster lookups
    },
    locationInterval: { 
        type: Number, 
        default: 60000, 
        min: [5000, "Interval must be at least 5 seconds"] 
    },
    lastModified: { 
        type: Number, 
        default: () => Date.now() 
    }
});

// Prevent model recompilation error in serverless
const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

// --- 2. ROBUST HANDLER ---
module.exports = async (req, res) => {
    await dbConnect(); // Ensure DB is connected

    const { deviceId } = req.query;

    try {
        if (req.method === 'POST') {
            // --- UPDATE SETTINGS (From Dashboard) ---
            if (!deviceId) return res.status(400).json({ error: "Missing deviceId" });

            const { locationInterval } = req.body;

            const updatedSettings = await Settings.findOneAndUpdate(
                { deviceId: deviceId },
                { 
                    locationInterval: locationInterval,
                    lastModified: Date.now() 
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            console.log(`[SETTINGS] Updated for ${deviceId}: ${locationInterval}ms`);
            return res.status(200).json(updatedSettings);

        } else if (req.method === 'GET') {
            // --- FETCH SETTINGS (From Android App) ---
            if (!deviceId) return res.status(400).json({ error: "Missing deviceId" });

            let settings = await Settings.findOne({ deviceId: deviceId });

            // If no settings exist yet, create defaults
            if (!settings) {
                console.log(`[SETTINGS] Creating new default profile for ${deviceId}`);
                settings = await Settings.create({
                    deviceId: deviceId,
                    locationInterval: 60000,
                    lastModified: Date.now()
                });
            }

            return res.status(200).json(settings);
        } else {
            return res.status(405).json({ error: "Method not allowed" });
        }
    } catch (error) {
        console.error("[SETTINGS ERROR]", error);
        return res.status(500).json({ error: error.message });
    }
};