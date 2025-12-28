const mongoose = require('mongoose');
const dbConnect = require('./db');
const Device = require('../models/Device');

// Define Schema inside here to keep it simple, or move to models/AppLog.js
const AppLogSchema = new mongoose.Schema({
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    timestamp: { type: Date, default: Date.now },
    apps: [{
        name: String,
        packageName: String,
        duration: String,
        minutes: Number
    }]
});

const AppLog = mongoose.models.AppLog || mongoose.model('AppLog', AppLogSchema);

module.exports = async (req, res) => {
    await dbConnect();

    if (req.method === 'POST') {
        try {
            const { deviceId, apps } = req.body;

            if (!deviceId || !apps) return res.status(400).json({ error: "Missing data" });

            // 1. Update "Last Seen" on the device
            await Device.findByIdAndUpdate(deviceId, { lastSeen: Date.now() });

            // 2. Save the Log
            await AppLog.create({
                deviceId,
                apps,
                timestamp: Date.now()
            });

            console.log(`[USAGE] Saved ${apps.length} app stats for ${deviceId}`);
            return res.status(200).json({ status: 'saved' });

        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: e.message });
        }
    }
    
    return res.status(405).end();
};