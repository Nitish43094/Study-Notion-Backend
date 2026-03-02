const Section = require('../models/Section')
const Course = require('../models/Course');
const SubSection = require('../models/SubSection');

exports.createSection = async(req,res) =>{
    try{
        const {sectionName, courseId} = req.body;

        if(!sectionName || !courseId) {
            return res.status(400).json({
                succees:false,
                message:"Missing Properties",
            })
        }
        // create section
        const newSection = await Section.create({sectionName})
        // Update Course with section Object id
        const updateCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                $push:{
                    courseContent:newSection._id,
                }
            },
            {new:true},
        ).populate("courseContent").exec();
        // return response 
        return res.status(200).json({
            succees:true,
            message:"Section Create Successfully",
            data:updateCourse,
        })
    }catch(error){
        return res.status(500).json({
            message:"Unable to create section name , please try again",
            error:error.message,
        })
    }
}

exports.updateSection = async(req,res)=>{
    try{
        // console.log(req.body)
        const {sectionName,sectionId,courseId} = req.body
        if(!sectionName || !sectionId || !courseId) {
            return res.status(400).json({
                succees:false,
                message:"Missing Properties",
            })
        }
        // 
        const section = await Section.findByIdAndUpdate(
            sectionId,
            {sectionName},
            {new:true},
        )
        const course = await Course.findById({_id:courseId}).populate("courseContent").exec();
        return res.status(200).json({
            succees:true,
            data:course,
            message:"Section Updated Successfully",
        })
    }catch(error){
        return res.status(500).json({
            message:"Unable to update section name , please try again",
            error:error.message,
        })
    }
}

exports.deleteSection = async(req,res) =>{
    try{
        const {sectionId, courseId} = req.body
        if(!sectionId || !courseId) {
            return res.status(400).json({
                succees:false,
                message:"Missing Properties",
            })
        }
        await Section.findByIdAndDelete(sectionId);
        const course = await Course.findByIdAndUpdate(
            courseId,
            {
                $pull:{
                    courseContent:sectionId,
                }
            }
        ).populate("courseContent").exec();
        return res.status(200).json({
            succees:true,
            data:course,
            message:"Delete Successfully",
        })
    }catch(error){
        return res.status(500).json({
            message:"Unable to delete section , please try again",
            error:error.message,
        })
    }
}

exports.getAllSection = async(req,res) =>{
    try{
        const allSection = await Section.find();
        return res.status(200).json({
            succees:true,
            message:"Geting Successfully",
            allSection,
        })
    }catch(error){
        console.log(error)
        res.status(500).json({
            success:false,
            message:"Somthing wrong while Gating The All Section",
        })
    }
}