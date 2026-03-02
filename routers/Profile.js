const express = require('express')
const router = express.Router()

const { auth,isInstructor } = require('../middilewares/auth')

const {
    updateProfile,
    deleteAccount,
    allUserDetails,
    updateDisplayPicture,
    getEnrolledCourse,
    instructorDashboard
} = require('../controllers/Profile')

// ********************************************************************************************************
//                                      Profile routes
// ********************************************************************************************************

router.put('/updateProfile', auth,updateProfile)
router.get('/getUserDetails',auth,allUserDetails)
router.delete('/deleteProfile',auth,deleteAccount)

router.get('/getEnrolledCourse',auth,getEnrolledCourse)
router.put('/updateDisplayPicture',auth,updateDisplayPicture)
router.get('/instructorDashboard',auth,isInstructor,instructorDashboard)

module.exports = router;