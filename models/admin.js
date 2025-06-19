const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique: true }
});


const Admin = mongoose.model('Admin', adminSchema);

// async function createAdmin() {
//   try {
//     const newAdmin = new Admin({
//       username: "pratham_sarraf",
//       password: "iamthegod"
//     });
//     await newAdmin.save();
//   } catch (err) {
//     console.error('Error saving admin:', err);
//   }
// }

// createAdmin();

module.exports = Admin;
