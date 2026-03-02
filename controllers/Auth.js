const User = require('../models/User')
const OTP = require('../models/OTP')
const Profile = require('../models/Profile')
const otpGenerator = require('otp-generator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mailSender = require('../utils/mailSender')
const {passwordUpdated} = require('../mail/templates/passwordUpdate')
require('dotenv').config()

// send OTP
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body
        const checkUserPresent = await User.findOne({ email });

        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: "User is Already Registered",
            })
        }
        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        // Make sure OTP is unique
        let otpExists = await OTP.findOne({ otp });
        console.log("Result is Generate OTP Func")
        console.log("OTP", otp)
        console.log("Result", otpExists)
        while (otpExists) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            otpExists = await OTP.findOne({ otp });
        }
        const otpPayload = { email, otp }
        const otpBody = await OTP.create(otpPayload)
        console.log("OTP Body", otpBody)
        res.status(200).json({
            success: true,
            message: "OTP sent Successfully",
            otp,
        })
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({
            success: false,
            error: error.message
        })
    }
}
// sign UP
exports.signup = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            conformPassword,
            accountType,
            otp,
        } = req.body;

        // ✅ Field validation
        if (!firstName || !lastName || !email || !password || !conformPassword || !otp) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // ✅ Password match check
        if (password !== conformPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        // ✅ Account type validation (ADDED)
        if (!["Student", "Instructor"].includes(accountType)) {
            return res.status(400).json({
                success:false,
                message:"Invalid account type"
            })
        }

        // ✅ Check existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        // ✅ OTP one-time use verification (REPLACED LOGIC)
        const otpRecord = await OTP.findOneAndDelete({
            email,
            otp: String(otp)   // handles string/number mismatch
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        // 🔐 Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const approved = accountType === "Instructor" ? false : true;

        // 👤 Create profile
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        });

        // 👤 Create user (SPELLING FIXED)
        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            accountType,
            approved,
            additionlDetails: profileDetails._id,  // ✅ FIXED NAME
            image: `https://api.dicebear.com/7.x/initials/png?seed=${firstName}%20${lastName}`,
        });

        // ❌ Don't send password back
        const userResponse = user.toObject();
        delete userResponse.password;

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: userResponse,
        });

    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({
            success: false,
            message: "Signup failed",
        });
    }
};


// login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please Fill up all the required Fields",
            })
        }
        const user = await User.findOne({ email })
            .populate("additionlDetails")
            
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User is not Registered with Up Please Signup to Continue",
            })
        }

        // Generate JWT token and Compare Password
        if (await bcrypt.compare(password, user.password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            )

            // save token to user document in database
            user.token = token
            user.password = undefined

            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: `User Login Success`,
            })
        } else {
            return res.status(401).json({
                success: false,
                message: `Password is Incorrect`,
            })
        }
    } catch (error) {
        console.error(error)
        // Return 500 Internal Server Error status code with error message
        return res.status(500).json({
            success: false,
            message: `Login Failure Please Try Again`,
        })
    }
}
// change Password
exports.changePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        const { oldPassword, newPassword } = req.body
        if (!oldPassword || !newPassword) {
            return res.status(401).json({
                success: false,
                message: `Old Password and New Password are Required`,
            })
        }
        const isPasswordMatch = await bcrypt.compare(oldPassword, user.password)

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: `The Password is Incorrect`,
            })
        }

        // update password 
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: hashedPassword },
            { new: true }
        )
        // send notification email
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                "Password  for your account has been updated",
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated Successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            )
            console.log("Email Sent Successfully:", emailResponse.response)
        } catch (error) {
            console.error("Error occurred while sending email:", error)
            return res.status(500).json({
                success: false,
                message: "Error occurred while sending email",
                error: error.message,
            })
        }
        return res.status(200).json({
            success: true,
            message: "Password updated successfully"
        })
    } catch (error) {
        // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while updating password:", error)
        return res.status(500).json({
            success: false,
            message: "Error occurred while updating password",
            error: error.message,
        })
    }
}