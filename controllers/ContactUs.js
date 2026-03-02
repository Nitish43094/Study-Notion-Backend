const {contactUsEmail} = require('../mail/templates/contactUsEmail')
const mailSender = require('../utils/mailSender')

exports.contactUsController = async(req,res) =>{
    const {email,firstName,lastName,message,phoneNo,countryCode} = req.body
    try{
        const emailResponse = await mailSender(
            email,
            "Your Data send Successfully",
            contactUsEmail(email,firstName,lastName,message,phoneNo,countryCode)
        )
        console.log("Email Response ",emailResponse);
        return res.status(200).json({
            success:true,
            message:"Email Send Successfylly",
        })
    }catch(error){
        console.log("Error",error)
        return res.status(500).json({
            success:false,
            message:"Somthing went error..."
        })
    }
}