const mongoose = require('mongoose');
const dbConnect = require('./db');
const User = require('../models/User');

module.exports = async (req, res) => {
    await dbConnect();

    if (req.method === 'POST') {
        const { action, email, password } = req.body;

        if (action === 'register') {
            try {
                const newUser = await User.create({ email, password });
                return res.status(200).json({ success: true, userId: newUser._id });
            } catch (e) {
                return res.status(400).json({ error: "Email already exists" });
            }
        } 
        
        if (action === 'login') {
            const user = await User.findOne({ email, password });
            if (!user) return res.status(401).json({ error: "Invalid credentials" });
            return res.status(200).json({ success: true, userId: user._id, email: user.email });
        }
    }
    return res.status(405).end();
};