import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ["superadmin", "admin", "user"],
    default: "user"
  },
  email: {
    type: String,
    required: false,
    unique: false
  },
  isProtected: {
    type: Boolean,
    default: false
  }
  ,
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model("Usuarios", usuarioSchema);