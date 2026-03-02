const instance = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const { paymentSuccessEmail } = require('../mail/templates/paymentSuccessEmail')
const mongoose = require("mongoose");
const crypto = require("crypto");
const CourseProgress = require("../models/CourseProgress");

exports.capturePayment = async (req, res) => {
  try {
    console.log("The Body Data -> ", req.body)
    const { courses } = req.body;
    const userId = req.user.id;

    if (!courses || courses.length === 0) {
      return res.json({
        success: false,
        message: "Please provide course Id",
      });
    }

    let totalAmount = 0;

    for (const courseId of courses) {
      const course = await Course.findById(courseId);
      console.log("Course ID ->", courseId)
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Could not find the course",
        });
      }

      const uid = new mongoose.Types.ObjectId(userId);

      if (course.studentsEnrolled.includes(uid)) {
        return res.status(400).json({
          success: false,
          message: "Student already enrolled",
        });
      }

      totalAmount += course.price;
    }

    const options = {
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const paymentResponse = await instance.orders.create(options);

    return res.json({
      success: true,
      data: paymentResponse,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ================= VERIFY PAYMENT =================
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courses,
    } = req.body;

    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment Failed",
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid Signature",
      });
    }

    await enrolledStudent(courses, userId);

    return res.status(200).json({
      success: true,
      message: "Payment Verified & Course Enrolled",
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ================= ENROLL STUDENT =================
const enrolledStudent = async (courses, userId) => {
  if (!courses || !userId) {
    throw new Error("Missing course or userId");
  }

  for (const courseId of courses) {

    const enrolledCourse = await Course.findByIdAndUpdate(
      courseId,
      { $push: { studentsEnrolled: userId } },
      { new: true }
    );

    if (!enrolledCourse) {
      throw new Error("Course not found");
    }
    const courseProgress = await CourseProgress.create({
      courseID: courseId,
      userId: userId,
      completedVideos: [],
    })

    const student = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          courses: courseId,
          courseProgress: courseProgress._id
        }
      },
      { new: true }
    );

    await mailSender(
      student.email,
      `Successfully Enrolled into ${enrolledCourse.courseName}`,
      courseEnrollmentEmail(
        enrolledCourse.courseName,
        student.firstName
      )
    );
  }
};

exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body
  const userId = req.user.id
  if (!orderId || !paymentId || !amount) {
    return res.status(400).json({
      success: false,
      message: "Please Provide all the fields"
    })
  }
  try {
    const enrolledStudent = await User.findById(userId)
    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(`${enrolledStudent.firstName}`, amount / 100, orderId, paymentId)
    )
  } catch (error) {
    console.log("Error in Sending Mail")
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
// Only For One Product

// // capture the payment and initiate the razorpay order
// exports.capturePayment = async (req, res) => {
//     const { courseId } = req.body
//     const { userId } = req.user.id
//     if (!courseId) {
//         return res.json({
//             success: false,
//             message: "Please provide valid Course Id"
//         })
//     }
//     let course;
//     try {
//         course = await Course.findById(courseId)
//         if (!course) {
//             return res.json({
//                 success: false,
//                 message: "Could not find the course",
//             })
//         }
//         // user Already buy the course
//         // user id convert into object Id
//         const uid = new mongoose.Types.ObjectId(userId);
//         if (course.studentsEnrolled.includes(uid)) {
//             return res.status(200).json({
//                 success: false,
//                 message: "Could not find the course"
//             })
//         }
//     } catch (error) {
//         console.log(error)
//         return res.status(500).json({
//             success: false,
//             message: error.message,
//         })
//     }
//     //    order created
//     const amount = course.price;
//     const currency = "INR"

//     const options = {
//         amount: amount * 100,
//         currency,
//         receipt: Math.random(Date.now()).toString(),
//         notes: {
//             courseId: courseId,
//             userId,
//         }
//     }
//     //
//     try {
//         // initiate the payment using razorpay
//         const paymentResponse = await instance.orders.create(options)
//         console.log(paymentResponse)
//         // return response
//         return res.status(200).json({
//             success: false,
//             courseName: course.courseName,
//             courseDescription: course.courseDescription,
//             thumbnail: course.thumbnail,
//             orderId: paymentResponse.id,
//             currency: paymentResponse.currency,
//             amount: paymentResponse.amount,
//         })
//     } catch (error) {
//         consolel.log(error)
//         res.json({
//             success: false,
//             message: "Could not initiate order",
//         })
//     }
// }

// // verify the payment
// exports.verifySignature = async(req,res) =>{
//     const webHookSecret = "123456789"

//     const signature = req.headers["x-razorpay-signature"];
//     const shasum = crypto.createHmac("sha256",webHookSecret)
//     shasum.update(json.stringify(req.body))
//     const digest = shasum.digest("hex");
//     if(signature === digest){
//         console.log("Payment is Authorized");
//         const {courseId,userId} = req.body.payload.payment.entity.notes;
//         try{
//             // fulfil the action
//             // find the course and enroll the strudent in it
//             const enrolledCourse = await Course.findByIdAndUpdate(
//                 {_id:courseId},
//                 {$push:{studentsEnrolled:userId}},
//                 {new:true},
//             );
//             if(!enrolledCourse){
//                 return res.status(500).json({
//                     success:false,
//                     message:"Course not found",
//                 })
//             }
//             console.log(enrolledCourse)
//             // find the student and add the course to their list enrolled course me
//             const enrolledStudent = await User.findOneAndUpdate(
//                 {_id:userId},
//                 {$push:{courses:courseId}},
//                 {new:true},
//             )
//             console.log(enrolledStudent)
//             // mail send karna
//             const emailResponse = await mailSender(
//                 enrolledStudent.email,
//                 "Congratulation for CodeHelp",
//                 "You are onboarded into new CodeHelp Course",
//             )
//             console.log(emailResponse)
//             return res.status(200).json({
//                 success:true,
//                 message:"Signature Verifyed and Course Added"
//             })
//         }catch(error){
//             console.log(error)
//             return res.status(500).json({
//                 success:false,
//                 message:error.message,
//             })
//         }
//     }else{
//         return res.status(400).json({
//             success:false,
//             message:"Invalid Request",
//         })
//     }
// }