const express = require('express')
const router = express.Router();

// import required controllers and middlware function 
const {
    login,
    signup,
    sendOTP,
    changePassword,
} = require('../controllers/Auth')
const {
    resetPasswordToken,
    resetPassword,
} = require('../controllers/ResetPassword')
const { auth } = require('../middilewares/auth')

// Routes for Login, Signup, and Authentication

// ********************************************************************************************************
//                                      Authentication routes
// ********************************************************************************************************

// Route for user login
router.post('/login',login)

router.post('/signup',signup)

router.post('/sendotp',sendOTP)

router.post('/changepassword',auth,changePassword)

// ********************************************************************************************************
//                                      Reset Password
// ********************************************************************************************************

// Route for generating a reset password token

router.post('/reset-password-token',resetPasswordToken)

router.post('/reset-password',resetPassword)

module.exports = router;