const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

const adminAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // First check admins collection
            let admin = await Admin.findById(decoded.id).select('-password');
            
            // If not found in admins, check user's role field
            if (!admin) {
                const user = await User.findById(decoded.id).select('-password');
                
                if (user && (user.role === 'admin' || user.role === 'superadmin')) {
                    // User has admin role - allow access
                    req.admin = {
                        id: user._id,
                        name: user.fullName,
                        email: user.email,
                        role: user.role
                    };
                    return next();
                }
                
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized as admin'
                });
            }
            
            req.admin = admin;
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    } else {
        res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
};

module.exports = { adminAuth };