const express = require('express')
const router = express.Router()

const { capturePayment, verifyPayment, enrolledStudent,sendPaymentSuccessEmail } = require('../controllers/Payments')
const { auth, isStudent, isAdmin, isInstructor } = require('../middilewares/auth')

router.post('/capturePayment', auth, isStudent, capturePayment)
router.post('/verifySignature', auth, isStudent, verifyPayment)
router.post('/sendPaymentSuccessEmail',auth,isStudent,sendPaymentSuccessEmail)

module.exports = router;