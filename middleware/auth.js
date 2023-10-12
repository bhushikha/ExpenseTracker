
const jwt = require('jsonwebtoken');
const User = require('../models/users');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token) {
            return res.status(401).json({ success: false, message: 'Authorization header missing' });
        }

        try {
            const user = jwt.verify(token, process.env.TOKEN);
            const foundUser = await User.findByPk(user.userId);
            if (!foundUser) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }
            req.user = foundUser;
            next();
        } catch (error) {
            console.error(error); // Log the error for debugging
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = auth;
