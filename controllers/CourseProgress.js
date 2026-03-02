const SubSection = require('../models/SubSection');
const CourseProgress = require('../models/CourseProgress');

exports.updateCourseProgress = async (req, res) => {
    try {
        console.log("Course Progress ->",req.body)
        const { courseId, subSectionId } = req.body;
        const userId = req.user.id;

        // Validation
        if (!courseId || !subSectionId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Check subsection exists
        const subSection = await SubSection.findById(subSectionId);
        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "Invalid SubSection Id",
            });
        }

        // Find course progress
        const courseProgress = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId,
        });

        if (!courseProgress) {
            return res.status(404).json({
                success: false,
                message: "Course Progress does not exist",
            });
        }

        // Check if already completed
        if (courseProgress.completedVideos.includes(subSectionId)) {
            return res.status(400).json({
                success: false,
                message: "SubSection already completed",
            });
        }

        // Push subsection
        courseProgress.completedVideos.push(subSectionId);

        await courseProgress.save();

        return res.status(200).json({
            success: true,
            message: "Course Progress Updated Successfully",
            data: courseProgress,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};