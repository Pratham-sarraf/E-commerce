const mongoose = require("mongoose");

const connectDB = async () => {
    try {
await mongoose.connect(
  "mongodb+srv://pratham_sarraf_22:1234@cluster0.4me9u.mongodb.net/e-commerce?retryWrites=true&w=majority&appName=Cluster0"
);
        console.log("MongoDB connected successfully.");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1); // exit process with failure
    }
};

module.exports = connectDB;