const SubSection = require('../models/SubSection')
const Section = require('../models/Section')
const Course = require('../models/Course');
const { uploadImageToCloudinary } = require('../utils/imageUploader')
require('dotenv').config()

exports.createSubSection = async (req, res) => {
    try {
        console.log(req.body, " ", req.files.videoFile)
        const { title, timeDuration, description, sectionId, courseId } = req.body
        const video = req.files.videoFile;
        if (!title || !description || !sectionId || !video) {
            return res.status(400).json({
                success: false,
                message: "All Fields and video file are required.",
            })
        }
        // upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME, 20, 60)

        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl: uploadDetails.secure_url,
        })
        console.log("SubSection Details:", subSectionDetails)

        const updateSection = await Section.findByIdAndUpdate(
            sectionId,
            {
                $push: { subSection: subSectionDetails._id },
            },
            { new: true },
        ).populate('subSection').exec();
        console.log("Updated Section after adding SubSection : ", updateSection)

        const course = await Course.findById(courseId)
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                    model: "SubSection", // optional but safe
                },
            })
            .exec();

        return res.status(200).json({
            success: true,
            message: "SubSection Created Successfully",
            data: course,
        })
    } catch (error) {
        console.error("Error creating subsection: ", error.message); // Log error details
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating the subsection.",
        });
    }
}

exports.updateSubSection = async (req, res) => {
    try {
        console.log("Data ->", req.body, req.files)
        const { title, timeDuration, description, subSectionId, courseId } = req.body

        if (!title || !description || !subSectionId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "All Fields are Required",
            })
        }

        let videoUrl;   // 👈 important
        // ✅ Agar new video aayi hai
        if (req.files && req.files.videoFile) {
            const video = req.files.videoFile;

            const uploadDetails = await uploadImageToCloudinary(
                video,
                process.env.FOLDER_NAME
            );

            videoUrl = uploadDetails.secure_url;
        }
        // ✅ Update object dynamic bana do
        const updateData = {
            title,
            timeDuration,
            description,
        };

        if (videoUrl) {
            updateData.videoUrl = videoUrl;
        }
        const updatesubSectionDetails = await SubSection.findByIdAndUpdate(
            subSectionId,
            updateData,
            { new: true }
        );

        const course = await Course.findById(courseId)
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                    model: "SubSection", // optional but safe
                },
            })
            .exec();
        return res.status(200).json({
            success: true,
            message: "Update successfully",
            data: course,
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while Updating the Section",
        })
    }
}


exports.deleteSubSection = async (req, res) => {
    try {
        console.log("Sub section Details ->", req.body)

        const { subSectionId, sectionId, courseId } = req.body

        if (!subSectionId || !sectionId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            })
        }

        // ✅ Delete Subsection First
        const deletedSubsection = await SubSection.findByIdAndDelete(subSectionId)

        console.log("Deleted:", deletedSubsection)

        if (!deletedSubsection) {
            return res.status(404).json({
                success: false,
                message: "SubSection Not Found",
            })
        }

        // ✅ Remove reference from Section
        await Section.findByIdAndUpdate(
            sectionId,
            {
                $pull: { subSection: subSectionId }
            },
            { new: true }
        )

        // ✅ Get updated course
        const course = await Course.findById(courseId)
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })

        return res.status(200).json({
            success: true,
            data: course,
            message: "SubSection Deleted Successfully",
        })

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting subsection",
        })
    }
}
