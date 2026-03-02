const RatingAndReviews = require('../models/RatingAndReview')
const Course = require('../models/Course');
const mongoose = require('mongoose');

// create rating 
exports.createRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, rating, review } = req.body;

    console.log("Rating data ->", req.body);

    // validation
    if (!courseId || !rating || !review) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check enrollment
    const courseDetails = await Course.findOne({
      _id: courseId,
      studentsEnrolled: { $elemMatch: { $eq: userId } },
    });

    if (!courseDetails) {
      return res.status(401).json({
        success: false,
        message: "Student is not enrolled in this course",
      });
    }

    // check already reviewed
    const alreadyReviewed = await RatingAndReviews.findOne({
      user: userId,
      course: courseId,
    });

    if (alreadyReviewed) {
      return res.status(403).json({
        success: false,
        message: "Course already reviewed",
      });
    }

    // create review
    const ratingReviews = await RatingAndReviews.create({
      rating: Number(rating),
      review,
      course: courseId,
      user: userId,
    });

    // push review into course
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: { ratingAndReviews: ratingReviews._id },
      },
      { new: true }
    );

    console.log(updatedCourseDetails);

    return res.status(200).json({
      success: true,
      data: ratingReviews,
      message: "Rating and Review created successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Average Rating and Review
exports.getAverageRating = async (req, res) => {
    try {
        // get Course Id
        const courseId = req.body.courseId
        // calculate 
        const result = await RatingAndReviews.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId)
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                }
            }
        ])
        // return reating
        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            })
        }
        // if no reating / review exist
        return res.status(200).json({
            success: true,
            message: "Average Rating is 0, no rating given till now",
            averageRating: 0,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// get allRating and review
exports.getAllRating = async (req, res) => {
    try {
        const allReviews = await RatingAndReviews.find({})
            .sort({ rating: "desc" })
            .populate({
                path: "user",
                select: "firstName lastName email image",
            })
            .populate({
                path: "course",
                select: "courseName",
            })
            .exec();
        return res.status(200).json({
            success: true,
            message: "All reviews fetched successfully",
            data: allReviews,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}