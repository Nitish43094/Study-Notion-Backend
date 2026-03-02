const User = require('../models/User')
const mailSender = require('../utils/mailSender')
const crypto = require("crypto");
const bcrypt = require('bcrypt')
// reset Password Token 
exports.resetPasswordToken = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            res.status(400).json({
                success: false,
                message: "Email Is Required",
            })
        }
        const user = await User.findOne({ email: email })
        if (!user) {
            return res.json({
                success: false,
                message: "You Email Is not registered with us",
            })
        }
        const token = crypto.randomUUID();
        const updatedDetails = await User.findOneAndUpdate(
            { email: email },
            {
                token: token,
                resetPasswordExpires: Date.now() + 5 * 60 * 1000,
            },
            { new: true }
        )
        console.log("DETAILS", updatedDetails);

        const url = `http://localhost:5173/update-password/${token}`;
        
        await mailSender(
            email,
            "Password Reset Token",
            `Password Reset Link ${url}`
        );
        res.json({
            success: true,
            message:
                "Email Sent Successfully, Please Check Your Email to Continue Further",
        });
    } catch (error) {
        return res.json({
            error: error.message,
            success: false,
            message: `Some Error in Sending the Reset Message`,
        });
    }
}

// reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword, token } = req.body

        if (confirmPassword !== password) {
			return res.json({
				success: false,
				message: "Password and Confirm Password Does not Match",
			});
		}
        const userDetails = await User.findOne({token:token})
        if(!userDetails){
            return res.json({
                success:false,
                message:"Token is Invalid",
            })
        }
        // Toke time check 
        if(userDetails.resetPasswordExpires < Date.now()){
            return res.json({
                success:false,
                message :"Token is expired, please regenerate with us"
            })
        }
        // Encript Password
        const hashedPassword = await bcrypt.hash(password,10)
        await User.findOneAndUpdate(
            {token:token},
            {password:hashedPassword},
            {new:true},
        )
        return res.status(200).json({
            success:true,
            message:"Password Reset Successful",
        })
    } catch (error) {
        return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Updating the Password`,
		});
    }
}