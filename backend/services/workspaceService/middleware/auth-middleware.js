import jwt from "jsonwebtoken";
import UserView from "../models/user-view.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; //Bearer dhghjhdkjfg

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);


        const uv = await UserView.findOne({ userId: decoded.userId }).lean();
        if (!uv) return res.status(401).json({ message: "Unauthorized" });

        req.user = {
          _id: uv.userId, name: uv.name ?? decoded.name,
          email: uv.email ?? decoded.email, avatar: uv.profilePicture ?? null,
        };
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default authMiddleware;
