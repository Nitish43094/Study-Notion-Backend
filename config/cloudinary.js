const cloudinary = require('cloudinary').v2;
require('dotenv').config();

exports.cloudinaryConnect = () => {
    try {
        if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
            throw new Error("Cloudinary Environment Variables Missing");
        }

        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET,
        });

        console.log("Cloudinary Connected Successfully");
    } catch (error) {
        console.error("Cloudinary Connection Error:", error.message);
    }
};