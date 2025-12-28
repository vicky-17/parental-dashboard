const mongoose = require('mongoose');
const dbConnect = require('./db');
const AppRule = require('../models/Apps'); // User's file name
const Device = require('../models/Device');

module.exports = async (req, res) => {
    await dbConnect();

    // --- 1. SYNC FROM PHONE (Update installed apps & usage) ---
    if (req.method === 'POST') {
        const { deviceId, apps } = req.body; // apps = [{ packageName, appName, lastTime }]

        if (!deviceId || !apps) return res.status(400).json({ error: "Missing data" });

        try {
            // Update Device Last Seen
            await Device.findByIdAndUpdate(deviceId, { lastSeen: Date.now() });

            // Bulk Write for Performance (Efficiently update 50+ apps at once)
            const operations = apps.map(app => ({
                updateOne: {
                    filter: { deviceId: deviceId, packageName: app.packageName },
                    update: {
                        $set: {
                            appName: app.appName, // Keep name updated
                            installed: true,
                            lastopened: app.lastTime || Date.now()
                        },
                        // We do NOT set isLocked/dailyLimit here, so we don't overwrite parent rules
                    },
                    upsert: true // Create if doesn't exist
                }
            }));

            if (operations.length > 0) {
                await AppRule.bulkWrite(operations);
            }

            return res.status(200).json({ status: 'synced' });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    // --- 2. UPDATE RULES (From Web Dashboard) ---
    if (req.method === 'PUT') {
        const { ruleId, isLocked, dailyLimit, schedules } = req.body;
        const { deviceId } = req.query; // Pass deviceId to trigger sync flag

        try {
            await AppRule.findByIdAndUpdate(ruleId, {
                isLocked,
                dailyLimit,
                schedules
            });

            // Flag the device to re-sync settings immediately
            if (deviceId) {
                await Device.findByIdAndUpdate(deviceId, { lastModified: Date.now() });
            }

            return res.status(200).json({ status: 'updated' });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    // --- 3. GET APPS (For Web Dashboard) ---
    if (req.method === 'GET') {
        const { deviceId } = req.query;
        const apps = await AppRule.find({ deviceId }).sort({ appName: 1 });
        return res.status(200).json(apps);
    }
};


