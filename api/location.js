const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!mongoose.connection.readyState) {
    mongoose.connect(MONGODB_URI);
}

// Updated Schema
const LocationSchema = new mongoose.Schema({
    deviceId: String,
    latitude: Number,
    longitude: Number,
    timestamp: { type: Date, default: Date.now },
    batteryLevel: Number,
    appUsage: [String] // Array of strings for app usage
});

const Location = mongoose.models.Location || mongoose.model('Location', LocationSchema);

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const data = req.body;
            const newLocation = new Location({
                deviceId: data.deviceId,
                latitude: data.latitude,
                longitude: data.longitude,
                batteryLevel: data.batteryLevel,
                appUsage: data.appUsage
            });

            await newLocation.save();
            res.status(200).json({ status: 'Saved' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        // GET Request: Return latest 20 logs
        const logs = await Location.find().sort({ timestamp: -1 }).limit(20);
        res.status(200).json(logs);
    }
};