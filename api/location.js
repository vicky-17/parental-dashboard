// api/location.js
const mongoose = require('mongoose');

// 1. Connect to MongoDB (Replace with your actual Connection String)
const MONGODB_URI = process.env.MONGODB_URI;

if (!mongoose.connection.readyState) {
    mongoose.connect(MONGODB_URI);
}

// 2. Define the Data Schema
const LocationSchema = new mongoose.Schema({
        deviceId: String,
        latitude: Number,
        longitude: Number,
        timestamp: { type: Date, default: Date.now },
        batteryLevel: Number,
        isCharging: Boolean,
        lastApp: String
    });

const Location = mongoose.models.Location || mongoose.model('Location', LocationSchema);

// 3. Handle the Request
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const data = req.body;

            // Save to Database
            const newLocation = new Location({
                deviceId: data.deviceId,
                latitude: data.latitude,
                longitude: data.longitude,
                batteryLevel: data.batteryLevel,
                isCharging: data.isCharging,
                lastApp: data.lastApp
            });

            await newLocation.save();
            res.status(200).json({ status: 'Data Saved' });
        } catch (error) {
            res.status(500).json({ error: 'Database Error' });
        }
    } else {
        // If someone opens the URL in a browser (GET request), show latest data
        const logs = await Location.find().sort({ timestamp: -1 }).limit(10);
        res.status(200).json(logs);
    }
};