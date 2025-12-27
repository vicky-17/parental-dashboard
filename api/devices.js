const mongoose = require('mongoose');
const dbConnect = require('./db');
const Device = require('../models/Device');

module.exports = async (req, res) => {
    await dbConnect();
    const { action, userId, deviceId } = req.query;

    // 1. GET ALL DEVICES for a Parent
    if (req.method === 'GET' && action === 'list') {
        const devices = await Device.find({ userId });
        return res.status(200).json(devices);
    }

    // 2. GENERATE PAIRING CODE (Parent clicks "Add Device")
    if (req.method === 'POST' && action === 'generate_code') {
        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
        const newDevice = await Device.create({
            userId: req.body.userId,
            name: req.body.name || "New Device",
            pairingCode: code,
            isPaired: false
        });
        return res.status(200).json({ code: code, deviceId: newDevice._id });
    }

    // 3. PAIR DEVICE (Called by Android App)
    if (req.method === 'POST' && action === 'pair') {
        const { code } = req.body;
        const device = await Device.findOne({ pairingCode: code, isPaired: false });

        if (!device) return res.status(400).json({ error: "Invalid or expired code" });

        device.isPaired = true;
        device.pairingCode = null; // Clear code so it can't be reused
        await device.save();

        return res.status(200).json({ success: true, deviceId: device._id, settings: device.settings });
    }
    
    return res.status(405).end();
};