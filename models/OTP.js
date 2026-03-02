const mongoose = require('mongoose')
const mailSender = require('../utils/mailSender')
const emailTemplate = require('../mail/templates/emailVarificationTemplates')

const OTPSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:60*5*1000
    }
})

// Function to send verification email
async function sendVerificationEmail(email, otp) {
    try{
        const mailResponse = await mailSender(
            email,
            "Verification Email",
            emailTemplate(otp),
        )
        console.log("Email sent Successfully ", mailResponse.response);
    }catch(error){
        console.log("Error Occurred While Sending Email", error)
        throw error;
    }
}

// ✅ FIXED: async hook WITHOUT next
OTPSchema.pre("save", async function () {
    console.log("New Document save to database");

    if(this.isNew){
        await sendVerificationEmail(this.email, this.otp);
    }
})

module.exports = mongoose.model("OTP", OTPSchema);
