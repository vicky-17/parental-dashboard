const mongoose = require('mongoose');
const dbConnect = require('./db');
const Device = require('../models/Device');
const AppRule = require('../models/Apps');

module.exports = async (req, res) => {
    await dbConnect();
    const { deviceId } = req.query;

    if (!deviceId) return res.status(400).json({ error: "Missing Device ID" });

    // --- GET: Called by Android Phone & Dashboard (Load) ---
    if (req.method === 'GET') {
        try {
            // 1. Get Global Device Settings
            const device = await Device.findById(deviceId);
            if (!device) return res.status(404).json({ error: "Device not found" });

            // 2. Get App Rules (Only specific fields needed for blocking)
            const rules = await AppRule.find({ deviceId })
                .select('packageName isLocked dailyLimit schedules');

            // 3. Send Combined Data
            return res.status(200).json({
                settings: {
                    locationInterval: device.locationInterval,
                    appSyncInterval: device.appSyncInterval,
                    lastModified: device.lastModified
                },
                rules: rules // The list of locked/limited apps
            });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    // --- POST: Called by Dashboard (Save Intervals) ---
    if (req.method === 'POST') {
        try {
            const { locationInterval, appSyncInterval } = req.body;

            // Update the Device document with new intervals & timestamp
            const updatedDevice = await Device.findByIdAndUpdate(
                deviceId,
                {
                    locationInterval: parseInt(locationInterval),
                    appSyncInterval: parseInt(appSyncInterval),
                    lastModified: Date.now() // Trigger phone sync
                },
                { new: true }
            );

            return res.status(200).json(updatedDevice);
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};