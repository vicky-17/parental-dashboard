const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!mongoose.connection.readyState) {
    mongoose.connect(MONGODB_URI);
}

// Updated Schema to support App Usage with Time
const LocationSchema = new mongoose.Schema({
    deviceId: String,
    latitude: Number,
    longitude: Number,
    timestamp: { type: Date, default: Date.now },
    batteryLevel: Number,
    // Changed from [String] to Array of Objects to store time for sorting
    appUsage: [{
        name: String,
        duration: String, // e.g., "1h 30m" (for display)
        minutes: Number   // e.g., 90 (for sorting)
    }] 
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
                appUsage: data.appUsage // Expecting [{name: "Youtube", duration: "10m", minutes: 10}, ...]
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