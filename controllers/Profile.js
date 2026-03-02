const User = require('../models/User')
const Profile = require("../models/Profile")
const CourseProgress = require('../models/CourseProgress')
const { uploadImageToCloudinary } = require('../utils/imageUploader')
const { convertSecondsToDuration } = require('../utils/convertSecondsToDuration')
const Course = require('../models/Course')

exports.updateProfile = async (req, res) => {
    try {

        const { gender, dateOfBirth = "", about = "", contactNumber } = req.body
        const { id } = req.user;
        if (!contactNumber || !gender) {
            return res.status(400).json({
                success: false,
                message: "All Field are required",
            })
        }
        // find Profile
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionlDetails;
        const profileDetails = await Profile.findById(profileId)
        // update Profile
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.gender = gender;
        profileDetails.contactNumber = contactNumber;
        await profileDetails.save();

        const alldata = await User.findById(id).populate("additionlDetails").exec();
        // return respinse
        return res.status(200).json({
            success: true,
            message: "Profile Update Successfully",
            profileAdditional: profileDetails,
            data: alldata,
        })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Somthing went wrong while Updating the Profile",
        })
    }
}
// Delete account
exports.deleteAccount = async (req, res) => {
    try {
        const id = req.user.id;
        const userDetails = await User.findById(id)
        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not find",
            })
        }
        await Profile.findByIdAndDelete({ _id: userDetails.additionlDetails });
        // HW - unEnrool user from all enrolle courses 
        await User.findByIdAndDelete({ _id: id })
        return res.status(200).json({
            success: true,
            message: "Profile Delete successfully",
            userDetails,
        })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Somthing went wrong while Deleteing the Account",
        })
    }
}
// get full user Details
exports.allUserDetails = async (req, res) => {
    try {
        const id = req.user.id;
        const userDetails = await User.findById(id).populate('additionlDetails').exec()

        return res.status(200).json({
            success: true,
            userDetails,
            message: "User Data fetch Successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Somthing went wrong while Gating the User Details",
        })
    }
}
// 
exports.updateDisplayPicture = async (req, res) => {
    try {
        const newDisplayPicture = req.files?.displayPicture;

        console.log("Update Profile Image:", newDisplayPicture);

        if (!newDisplayPicture) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded. Please upload a profile picture.",
            });
        }

        const id = req.user.id;

        const userDetails = await User.findById(id);
        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const response = await uploadImageToCloudinary(
            newDisplayPicture,
            process.env.FOLDER_NAME
        );

        userDetails.image = response.secure_url;
        await userDetails.save();

        return res.status(200).json({
            success: true,
            message: "Display picture updated successfully",
            data: userDetails, // 👈 frontend ke liye best
        });

    } catch (error) {
        console.log("UPDATE DISPLAY ERROR:", error.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating display picture",
        });
    }
};
// 
exports.getEnrolledCourse = async (req, res) => {
    try {
        const userId = req.user.id
        const courses = await User.findOne({ _id: userId })
            .populate({
                path: "courses",
                populate: {
                    path: "courseContent",
                    populate: {
                        path: "subSection"
                    }
                }
            })
            .exec();

        userDetails = courses.toObject()
        var SubsectionLength = 0
        for (var i = 0; i < userDetails.courses.length; i++) {
            let totalDurationInSeconds = 0
            SubsectionLength = 0
            for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
                totalDurationInSeconds += userDetails.courses[i].courseContent[
                    j
                ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
                userDetails.courses[i].totalDuration = convertSecondsToDuration(
                    totalDurationInSeconds
                )
                SubsectionLength +=
                    userDetails.courses[i].courseContent[j].subSection.length
            }
            let courseProgressCount = await CourseProgress.findOne({
                courseID: userDetails.courses[i]._id,
                userId: userId,
            })
            courseProgressCount = courseProgressCount?.completedVideos.length
            if (SubsectionLength === 0) {
                userDetails.courses[i].progressPercentage = 100
            } else {
                // To make it up to 2 decimal point
                const multiplier = Math.pow(10, 2)
                userDetails.courses[i].progressPercentage =
                    Math.round(
                        (courseProgressCount / SubsectionLength) * 100 * multiplier
                    ) / multiplier
            }
        }

        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "Not get Enrolled Course"
            })
        }

        return res.status(200).json({
            success: true,
            courses: userDetails.courses,
            message: "All Courses Details",
        })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while Gating the All Enrolled Course.",
        });
    }
}

exports.instructorDashboard = async (req, res) => {
    try {
        console.log("This is Instructor dashboard");

        const userId = req.user.id;

        const courseDetails = await Course.find({ instructor: userId });

        const courseData = courseDetails.map((course) => {

            const totalEnrolledStudent = course.studentsEnrolled?.length || 0;

            const totalAmountGenerated =
                totalEnrolledStudent * Number(course.price || 0);

            return {
                _id: course._id,
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                totalEnrolledStudent,
                totalAmountGenerated,
            };
        });

        return res.status(200).json({
            success: true,
            data: courseData,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};