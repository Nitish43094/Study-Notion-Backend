const express = require('express')
const router = express.Router();

const {
   createCourse,
   editCourse,
   getAllCourses,
   getAllCoursesByInstructor,
   getCourseDetails,
   deleteCourse,
   getFullCourseDetails
} = require('../controllers/Course')

const {
    createCategory,
    showAllCategories,
    categorysDetails,
} = require('../controllers/Category')

const {updateCourseProgress} = require('../controllers/CourseProgress')

const {
    createSection,
    updateSection,
    getAllSection,
    deleteSection
} = require('../controllers/Section')

const {
    createSubSection,
    updateSubSection,
    deleteSubSection
} = require('../controllers/Subsection')

const {
    createRating,
    getAverageRating,
    getAllRating,
} = require('../controllers/RatingAndReview')

const {
    auth,
    isAdmin,
    isInstructor,
    isStudent
} = require('../middilewares/auth')

// *************************************************************
//                      Course Routes
// *************************************************************

// course Can only created by Instructor
router.post('/createCourse', auth, isInstructor, createCourse)
router.put('/editCourse',auth,isInstructor,editCourse)
router.get('/all-course',auth,getAllCoursesByInstructor)
router.delete("/deleteCourse", auth,isInstructor,deleteCourse)

router.post("/updateCourseProgress",auth,isStudent,updateCourseProgress)

// Get Details for a Specific Courses
router.post("/getCourseDetails", getCourseDetails)
router.post("/getFullCourseDetailse",auth,isStudent,getFullCourseDetails)
// Get all Courses Under a Specific Instructor
// router.get("/getInstructorCourses", auth, isInstructor, getInstructiorCourse)
// Add A section to a course 
router.post('/createSection', auth, isInstructor, createSection)
// Update the section
router.put('/updateSection', auth, isInstructor, updateSection)
// Delete the section
router.delete('/deleteSection', auth, isInstructor, deleteSection)
// get All section Details
router.get('/getallSection',getAllSection);

// Add A subsection to a course 
router.post('/createSubSection', auth, isInstructor, createSubSection)
// Update the subsection
router.put('/updateSubSection', auth, isInstructor, updateSubSection)
// Delete the subsection
router.delete('/deleteSubSection', auth, isInstructor, deleteSubSection)
// Get all Register Course
router.get('/getAllCources', getAllCourses)
// get Details for Spacific Course
// router.get('/getCourseDetails', getCourseDetails)

// ********************************************************************************************************
//                                      Category routes (Only by Admin)
// ******************************************************************************************************** 
// Category can Only be Created by Admin
// TODO: Put IsAdmin Middleware here
router.post("/createCategories", auth, isAdmin, createCategory);
router.get("/showAllCategoriess", showAllCategories);
router.post("/getCategoriesDetails", categorysDetails)

// **************************************************************
//                      Rating and Review
// **************************************************************
router.post('/createRating', auth, isStudent, createRating)
router.get('/getAverageRating', getAverageRating)
router.get('/getAllRating', getAllRating)


module.exports = router;