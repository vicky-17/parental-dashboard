const mongoose = require('mongoose');
const dbConnect = require('./db');
const Location = require('../models/Location');
const Device = require('../models/Device');

module.exports = async (req, res) => {
    await dbConnect();

    if (req.method === 'POST') {
        // --- CHILD APP SENDING DATA ---
        const { deviceId, latitude, longitude, batteryLevel, appUsage } = req.body;

        // Verify device exists
        const device = await Device.findById(deviceId);
        if (!device) return res.status(404).json({ error: "Device not found" });

        // Update Last Seen
        device.lastSeen = Date.now();
        await device.save();

        // Save Location
        await Location.create({
            deviceId, latitude, longitude, batteryLevel, appUsage
        });

        return res.status(200).json({ status: 'saved' });
    } 
    
    if (req.method === 'GET') {
        // --- DASHBOARD FETCHING HISTORY ---
        const { deviceId } = req.query;
        const logs = await Location.find({ deviceId }).sort({ timestamp: -1 }).limit(50);
        return res.status(200).json(logs);
    }
};