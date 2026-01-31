import mongoose, { Schema } from "mongoose";

const userViewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, unique: true, index: true },
  name: String,
  email: { type: String, index: true },
  profilePicture: String,
  updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });

export default mongoose.model("UserView", userViewSchema);
