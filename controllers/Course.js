const Course = require('../models/Course')
const Category = require('../models/Category')
const User = require('../models/User')
const Section = require('../models/Section')
const SubSection = require('../models/SubSection');
const { uploadImageToCloudinary } = require('../utils/imageUploader')
const { convertSecondsToDuration } = require('../utils/convertSecondsToDuration')
const CourseProgress = require('../models/CourseProgress')

exports.createCourse = async (req, res) => {
    try {
        console.log("This is all info in add course", req.body);

        let {
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            category,
            instructions,
            tag,
        } = req.body;

        const thumbnail = req.files?.thumbnailImage;

        // Validation
        if (
            !courseName ||
            !courseDescription ||
            !whatYouWillLearn ||
            !price ||
            !category ||
            !thumbnail
        ) {
            return res.status(400).json({
                success: false,
                message: "All Fields are Mandatory",
            });
        }

        // Parse JSON fields
        const parsedInstructions = instructions ? JSON.parse(instructions) : [];
        const parsedTags = tag ? JSON.parse(tag) : [];

        // Check Instructor
        const userId = req.user.id;
        const instrtuctorDetails = await User.findById(userId);

        if (!instrtuctorDetails) {
            return res.status(404).json({
                success: false,
                message: "Instructor Details Not Found",
            });
        }

        // Check Category
        const categoryDetails = await Category.findById(category);
        if (!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: "Category Details Not Found",
            });
        }

        // Upload image to Cloudinary
        const thumbnailImage = await uploadImageToCloudinary(
            thumbnail,
            process.env.FOLDER_NAME
        );

        // Create Course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instrtuctorDetails._id,
            whatYouWillLearn,
            price,
            category: categoryDetails._id,
            thumbnail: thumbnailImage.secure_url,
            instructions: parsedInstructions,
            tag: parsedTags,
            status: "Draft",
        });

        // Update User
        await User.findByIdAndUpdate(
            instrtuctorDetails._id,
            {
                $push: { courses: newCourse._id },
            },
            { new: true }
        );

        // Update Category
        await Category.findByIdAndUpdate(
            category,
            {
                $push: { courses: newCourse._id },
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            data: newCourse,
            message: "Course Created Successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create course",
            error: error.message,
        });
    }
};
// Get All Course 
exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.find(
            { status: "Publiched" },
            {
                courseName: true,
                price: true,
                thumbnail: true,
                instructor: true,
                ratingAndReviews: true,
                studentsEnrolled: true,
            }
        ).populate("instructor").exec()

        return res.status(200).json({
            success: true,
            data: allCourses,
            message: "Here is All Courses",
        })
    } catch (error) {
        console.log(error)
        return res.status(404).json({
            success: false,
            message: `Can't Fetch Course Data`,
            error: error.message,
        })
    }
}
exports.getAllCoursesByInstructor = async (req, res) => {
    try {
        const userId = req.user.id;

        const courses = await Course.find({ instructor: userId });

        return res.status(200).json({
            success: true,
            data: courses,
            message: "All Course Created by you"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch instructor courses",
            error: error.message,
        });
    }
};

// Get Single Course 
exports.getCourseDetails = async (req, res) => {
    console.log("Inside the backend course id ->",req.body)
    try {
        const { courseId } = req.body
        const courseDetails = await Course.findById(courseId)
            .populate({
                path: "instructor",
                populate: {
                    path: "additionlDetails",
                }
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                    select: "-videoUrl",
                }
            }).exec();
        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find the course with this Id ${courseId}`
            })
        }
        let totalDurationInSeconds = 0;
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })
        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success: true,
            message: "Course Details Fetched Successfully",
            data: courseDetails,
            totalDuration,
        })
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// Update Course Details
exports.editCourse = async (req, res) => {
    try {
        console.log("This is all Update Course data ->", req.body);

        const { courseId, ...update } = req.body;

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course Not Found",
            });
        }

        // ✅ Thumbnail update
        if (req.files && req.files.thumbnailImage) {
            console.log("Thumbnail Update");

            const thumbnail = req.files.thumbnailImage;

            const response = await uploadImageToCloudinary(
                thumbnail,
                process.env.FOLDER_NAME
            );

            course.thumbnail = response.secure_url;
        }

        // ✅ Update only fields present
        for (const key in update) {
            if (Object.prototype.hasOwnProperty.call(update, key)) {

                if (key === "tag" || key === "instructions") {
                    course[key] = JSON.parse(update[key]);
                } else {
                    course[key] = update[key];
                }
            }
        }

        await course.save();

        const updatedCourse = await Course.findById(courseId)
            .populate({
                path: "instructor",
                populate: { path: "additionlDetails" },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: { path: "subSection" },
            })
            .exec();

        return res.status(200).json({
            success: true,
            data: updatedCourse,
            message: "Course Updated Successfully",
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// delete Course 
exports.deleteCourse = async (req, res) => {
    try {
        console.log("course ID ->", req.body);

        const { courseId } = req.body;
        const userId = req.user.id;

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        // ✅ Authorization check
        if (course.instructor.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        // ✅ Unenroll students
        const studentsEnrolled = course.studentsEnrolled;

        await Promise.all(
            studentsEnrolled.map((studentId) =>
                User.findByIdAndUpdate(studentId, {
                    $pull: { courses: courseId },
                })
            )
        );

        // ✅ Delete sections and subsections
        const courseSections = course.courseContent;

        for (const sectionId of courseSections) {
            const section = await Section.findById(sectionId);

            if (section) {
                const subSections = section.subSection;

                await Promise.all(
                    subSections.map((subId) =>
                        SubSection.findByIdAndDelete(subId)
                    )
                );
            }

            await Section.findByIdAndDelete(sectionId);
        }

        // ✅ Delete course
        await Course.findByIdAndDelete(courseId);

        // ✅ Remove course from instructor
        await User.findByIdAndUpdate(userId, {
            $pull: { courses: courseId },
        });

        return res.status(200).json({
            success: true,
            message: "Course Deleted Successfully",
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

exports.getFullCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body
        const userId = req.user.id;
        const courseDetails = await Course.findById(courseId)
            .populate({
                path: "instructor",
                populate: {
                    path: "additionlDetails",
                }
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                }
            }).exec();
        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find the course with this Id ${courseId}`
            })
        }

        let courseProgressCount = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId,
        })
        console.log("Course Progress Count", courseProgressCount)

        let totalDurationInSeconds = 0;
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })
        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success: true,
            message: "Course Detaiils Fetched Successfully",
            data: {
                courseDetails,
                totalDuration,
                completedVideos: courseProgressCount?.completedVideos
                    ? courseProgressCount?.completedVideos
                    : []
            }
        })
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}