const mongoose = require('mongoose');
const dbConnect = require('./db');

// --- 1. PERFECT SCHEMA ---
const LocationSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now, index: true }, // Index for sorting history
    batteryLevel: { type: Number },
    
    // Flexible App Usage Schema
    appUsage: [{
        name: String,
        duration: String,
        minutes: Number
    }]
});

const Location = mongoose.models.Location || mongoose.model('Location', LocationSchema);

// --- 2. ROBUST HANDLER ---
module.exports = async (req, res) => {
    await dbConnect();

    try {
        if (req.method === 'POST') {
            // --- SAVE LOCATION (From Android) ---
            const data = req.body;

            // Log raw data for debugging (Check Vercel Function Logs for this!)
            console.log(`[LOCATION POST] Received from ${data.deviceId} | Bat: ${data.batteryLevel}%`);

            if (!data.latitude || !data.longitude) {
                console.error("[LOCATION ERROR] Missing coordinates");
                return res.status(400).json({ error: "Missing lat/lng" });
            }

            const newLocation = new Location({
                deviceId: data.deviceId,
                latitude: data.latitude,
                longitude: data.longitude,
                batteryLevel: data.batteryLevel,
                appUsage: data.appUsage || [] // Default to empty array if missing
            });

            await newLocation.save();
            return res.status(200).json({ status: 'Saved', id: newLocation._id });

        } else if (req.method === 'GET') {
            // --- GET HISTORY (For Dashboard) ---
            // Sort by newest first, limit to last 50 points
            const logs = await Location.find()
                .sort({ timestamp: -1 })
                .limit(50);
            
            return res.status(200).json(logs);
        } else {
            return res.status(405).json({ error: "Method not allowed" });
        }
    } catch (error) {
        console.error("[LOCATION SERVER ERROR]", error);
        return res.status(500).json({ error: error.message });
    }
};