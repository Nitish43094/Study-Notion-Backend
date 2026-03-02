// Express framework import kar rahe hain server banane ke liye
const express = require('express')
const app = express();
// Environment variables (.env file) load karne ke liye
require('dotenv').config();
// Server kis port pe chalega
const PORT = process.env.PORT || 4000
// ================= CONFIG FILES =================
// Database connection file (MongoDB etc.)
const dbConnection = require('./config/dbConnection')

// Cloudinary config (images/videos cloud me upload karne ke liye)
const cloudinary = require('./config/cloudinary')

// ================= PACKAGES / MIDDLEWARES =================

// File upload handle karne ke liye middleware
const fileUplode = require('express-fileupload')

// Cookies read karne ke liye
const cookieParser = require('cookie-parser')

// Frontend aur backend ko connect karne ke liye (CORS policy)
const cors = require('cors')


// ================= ROUTES IMPORT =================

// Authentication se related routes (login, signup etc.)
const userRoutes = require('./routers/User')

// User profile related routes
const profileRoutes = require('./routers/Profile')

// Course related APIs
const courseRoutes = require('./routers/Course')

// Contact form related APIs
const contactRoutes = require('./routers/Contact')

// payment 
const paymentRoute = require('./routers/Payments')


// ================= GLOBAL MIDDLEWARES =================

// Incoming request body ko JSON format me read karne ke liye
app.use(express.json());

// Cookies ko access karne ke liye
app.use(cookieParser())

// CORS configuration (sirf ye frontend server allow hai)
app.use(
	cors({
		origin: "https://my-study-notion-learning.vercel.app/", // Frontend URL
		credentials: true, // Cookies allow karne ke liye
	})
)

// File upload middleware config
app.use(fileUplode({
	useTempFiles: true,       // Temporary files ka use karega
	tempFileDir: '/tmp/'      // Temporary storage folder
}));


// ================= DATABASE & CLOUD CONNECTION =================

// Database connect karna
dbConnection();

// Cloudinary connect karna
cloudinary.cloudinaryConnect();


// ================= ROUTES SETUP =================

// Auth routes ka base path
app.use('/api/v1/auth', userRoutes)

// Profile routes ka base path
app.use('/api/v1/profile', profileRoutes)

// Course routes ka base path
app.use('/api/v1/course', courseRoutes)

// Contact routes ka base path
app.use('/api/v1/contact', contactRoutes)
// Payment Routes
app.use("/api/v1/payment",paymentRoute)


// ================= DEFAULT ROUTE =================

// Agar koi root URL hit kare to ye response milega
app.get('/', (req, res) => {
	res.send(`<h1>This is a Study Notion Web App</h1>`)
})


// ================= SERVER START =================

// Server start kar rahe hain
app.listen(PORT, () => {
	console.log("The Server Started at Port No ", PORT)
})
