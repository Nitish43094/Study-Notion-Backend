const jwt = require('jsonwebtoken')
require('dotenv').config()
const User = require('../models/User')

exports.auth = async (req, res, next) => {
    try {
        let token;

        // Extract token safely
        if (req.cookies?.token) {
            token = req.cookies.token;
        } 
        else if (req.body?.token) {
            token = req.body.token;
        } 
        else if (req.headers.authorization?.replace("Bearer ","")) {
            token = req.headers.authorization.split(" ")[1];
        }
        // token = req.cookies?.token ||
        //     req.body?.token ||
        //     req.header("Authorization")?.replace("Bearer ", "");


        // If token missing
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token Missing",
            });
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // ✅ Store in request object
            req.user = decoded;

        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Token is invalid",
            });
        }

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Something went wrong while validating token",
        });
    }
};


exports.isStudent = async (req, res, next) => {
    try {
        const userDetails = await User.findOne({ email: req.user.email })
        console.log(userDetails);
        if (userDetails.accountType !== "Student") {
            return res.status(401).json({
                success: false,
                message: "This is a Protected Route for Students",
            })
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `User Role Can't be Verified`
        });
    }
}

exports.isAdmin = async (req, res, next) => {
    try {
        const userDetails = await User.findOne({ email: req.user.email })
        console.log(userDetails);
        if (userDetails.accountType !== "Admin") {
            res.status(401).json({
                success: false,
                message: "This is a Protected Route for Admin",
            })
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `User Role Can't be Verified`
        });
    }
}

exports.isInstructor = async (req, res, next) => {
    try {
        const userDetails = await User.findOne({ email: req.user.email })
        console.log(userDetails);
        if (userDetails.accountType !== "Instructor") {
            res.status(401).json({
                success: false,
                message: `This is a Protected Route for Instruction`
            })
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `User Role Can't be Verified`
        });
    }
}