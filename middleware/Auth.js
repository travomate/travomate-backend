const User = require('../src/models/userModel')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

dotenv.config()

const secretKey = 'VERYsecret12'

// function which checks if the user is signed in, by using a token given to every signed in user
exports.isAuth = async (req, res, next) => {
    if (req.headers && req.headers.authorization){
    const token = req.headers.authorization.split(' ')[1]
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decode.userId);
    if(!user){
        return res.json({success: false, message: 'unauthorized acess'})
    }
    req.user = user
    next()
    } catch (error) {
        if(error.name === 'JsonWebTokenError'){
           return res.json({success: false, message: 'unauthorized acess'})
        }
        if(error.name === 'TokenExpiredError'){
           return res.json({success: false, message: 'session expired'})
        }

        res.json({success: false, message: 'internal server error'});
    }
    
    } else {
        res.json({success: false, message: 'unauthorized acess'})
    }
    console.log(req.headers.authorization);
};

exports.authenticateToken = async (req, res, next) => {
    const authorizationHeader = req.header('Authorization');

    if (!authorizationHeader) {
        return res.status(401).json({ message: 'Token not provided' });
    }

    const token = authorizationHeader.split(' ')[1]; // Extract token without "Bearer"

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decodedToken.userId;
        next();
    } catch (err) {
        console.log(err);
        return res.status(403).json({ message: 'Invalid token' });
    }
};


