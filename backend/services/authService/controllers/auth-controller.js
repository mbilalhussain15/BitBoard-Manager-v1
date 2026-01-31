import User from "../models/user.js";
import bcrypt, { compareSync } from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../libs/email/sendEmail.js";
import { protect } from "../libs/securityRules.js";
import Verification from "../models/Verification.js";
import { sendPasswordResetEmail } from "../libs/email/sendPasswordResetEmail.js";
import emailValidator from "email-validator";
import { OAuth2Client } from 'google-auth-library';
import { publishUser } from "../libs/rabbitmq.js";
import crypto from "crypto";           


import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("../../.env") });


// import aj from "../libs/arcjet.js";

const registerUser = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    // const decision = await aj.protect(req, { email });
    // console.log("Arcjet decision", decision.isDenied());

    // if (decision.isDenied()) {
    //   res.writeHead(403, { "Content-Type": "application/json" });
    //   res.end(JSON.stringify({ message: "Invalid email address" }));
    // }
    const decision = await protect(req, { email });

    if (decision.isDenied()) {
      return res.status(403).json({ message: decision.message() });
    }


    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email address already in use",
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password: hashPassword,
      name,
      provider: "local",
    });

    if (!newUser) {
      return res.status(500).json({
        message: "Failed to create user",
      });
    }

    try {
      await publishUser("user.created", {
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        profilePicture: newUser.profilePicture || null,
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.warn("publish user.created failed (non-blocking):", e?.message || e);
    }

    const emailResponse = await sendEmail(email,newUser);

    if (!emailResponse.success) {
      return res.status(500).json({ message: "Failed to send verification email." });
    }


    res.status(201).json({
      message:
        "Verification email sent to your email. Please check and verify your account.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password +authProvider");

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

     if (user.authProvider === 'google') {
      return res.status(400).json({
        message: "This account uses Google Sign-In. Please sign in with Google.",
        code: "USE_GOOGLE_LOGIN"
      });
    }

    if (!user.isEmailVerified) {
      const existingVerification = await Verification.findOne({
        userId: user._id,
      });

      if (existingVerification && existingVerification.expiresAt > new Date()) {
        return res.status(400).json({
          message:
            "Email not verified. Please check your email for the verification link.",
        });
      } else {
        await Verification.findByIdAndDelete(existingVerification._id);

        const isEmailSent  = await sendEmail(email,user);

        if (!isEmailSent.success) {
          return res.status(500).json({ message: "Failed to send verification email." });
        }

        res.status(201).json({
          message:
            "Verification email sent to your email. Please check and verify your account.",
        });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name, purpose: "login" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.lastLogin = new Date();
    await user.save();

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // const payload = jwt.verify(token, process.env.JWT_SECRET);
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(400).json({
          success: false,
          message: "Verification link has expired",
          code: "TOKEN_EXPIRED",
          
        });
      }
      return res.status(400).json({
        success: false,
        message: "Invalid verification token",
        code: "INVALID_TOKEN"
      });
    }

   
    if (!payload) {
      return res.status(401).json({success: false, message: "Unauthorized", code: "INVALID_TOKEN"});
    }

    const { id, purpose } = payload;
  
    const userId = id;

    if (purpose !== "email-verification") {
      return res.status(401).json({success: false, message: "Unauthorized", code: "INVALID_PURPOSE" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({success: false, message: "User not found", code: "USER_NOT_FOUND" });
    }

    if (user.isEmailVerified) {
      return res.status(201).json({success: true, message: "Email already verified", code: "ALREADY_VERIFIED" });
    }
  
    const verification = await Verification.findOne({
      userId,
      token,
    });

    if (!verification) {
      return res.status(400).json({success: false, message: "Verification link expired or invalid", code: "INVALID_VERIFICATION" });
    }

    const isTokenExpired = verification.expiresAt < new Date();

   
    if (isTokenExpired) {
      return res.status(400).json({success: false, message: "Verification link expired", code: "TOKEN_EXPIRED" });
    }

    user.isEmailVerified = true;
    await user.save();

    await Verification.findByIdAndDelete(verification._id);

    try {
      await publishUser("user.updated", {
        userId: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || null,
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.warn("publish user.updated failed (non-blocking):", e?.message || e);
    }

    res.status(200).json({success: true, message: "Email verified successfully", code: "VERIFICATION_SUCCESS" });
  } catch (error) {
    console.log(error);
    res.status(500).json({success: false, message: "Internal server error", code: "SERVER_ERROR" });
  }
};

const resetPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !emailValidator.validate(email)) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide a valid email address",
        code: "INVALID_EMAIL"
      });
    }
    
    const decision = await protect(req, { email });
    
    if (decision.isDenied()) {
      return res.status(403).json({ message: decision.message() });
    }

    const user = await User.findOne({ email }).select("+authProvider");

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({
        message: "This account uses Google Sign-In. Password reset not available.",
        code: "GOOGLE_ACCOUNT_NO_PASSWORD"
      });
    }

    if (!user.isEmailVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Please verify your email first", code: "EMAIL_NOT_VERIFIED" });
    }

    const existingVerification = await Verification.findOne({
      userId: user._id,
    });

    if (existingVerification && existingVerification.expiresAt > new Date()) {
      return res.status(400).json({
        message: "Reset password request already sent",
      });
    }

    if (existingVerification && existingVerification.expiresAt < new Date()) {
      await Verification.findByIdAndDelete(existingVerification._id);
    }

    const isEmailSent = await sendPasswordResetEmail(email, user);
    if (!isEmailSent.success) {
      return res.status(500).json({success: false, message: "Failed to send reset password email.", code: "EMAIL_SEND_FAILED" });
    }

    res.status(200).json({ message: "Reset password email sent" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyResetPasswordTokenAndResetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;


    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        code: "MISSING_FIELDS"
      });
    }

    // const payload = jwt.verify(token, process.env.JWT_SECRET);

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(400).json({
          success: false,
          message: "Password reset link has expired",
          code: "TOKEN_EXPIRED",
          
        });
      }
      return res.status(400).json({
        success: false,
        message: "Invalid password reset token",
        code: "INVALID_TOKEN"
      });
    }

    console.log("Payload: ", payload);
    if (!payload) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id, purpose } = payload;

    const userId = id

    if (purpose !== "password-reset") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("+password +authProvider");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({
        message: "This account uses Google Sign-In. Password reset not available.",
        code: "GOOGLE_ACCOUNT_NO_PASSWORD"
      });
    }

    const verification = await Verification.findOne({
      userId,
      token,
    });

    if (!verification) {
      return res.status(400).json({ message: "Invalid or expired password reset token" });
    }

    const isTokenExpired = verification.expiresAt < new Date();

    if (isTokenExpired) {
      return res.status(401).json({ message: "Token expired" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
        code: "SAME_PASSWORD"
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashPassword;
    await user.save();

    await Verification.findByIdAndDelete(verification._id);

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;
        
        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Missing Google credential",
                code: "MISSING_CREDENTIAL"
            });
        }
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
            issuer: ['https://accounts.google.com', 'accounts.google.com']
        });
        
        const payload = ticket.getPayload();

        if (!payload.email_verified) {
            return res.status(403).json({
                success: false,
                message: "Google email not verified",
                code: "EMAIL_NOT_VERIFIED"
            });
        }
        if (new Date(payload.exp * 1000) < new Date()) {
            return res.status(403).json({
                success: false,
                message: "Google token expired",
                code: "TOKEN_EXPIRED"
            });
        }
        // Check if user exists in your database
        let user = await User.findOne({ email: payload.email }).select("+authProvider");
        
        if (!user) {
            // Create new user if doesn't exist
            user = await User.create({
                email: payload.email,
                name: payload.name,
                profilePicture: payload.picture || null,
                isEmailVerified: true,
                authProvider: 'google'
                // Add any other required fields
            });
            console.log("User created:", user);
            try {
              await publishUser("user.created", {
                userId: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture || null,
                updatedAt: Date.now(),
              });
            } catch (e) {
              console.warn("publish user.created (google) failed (non-blocking):", e?.message || e);
            }
        }
        else if (user.authProvider !== 'google') {
            // User exists but signed up with different method
            return res.status(400).json({
                message: "Account already exists with different login method",
                code: "ACCOUNT_CONFLICT"
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name, purpose: "login", authProvider: 'google' },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        user.lastLogin = new Date();
        await user.save();

        const userData = user.toObject();
        delete userData.password;

        res.status(200).json({
            message: "Google login successful",
            token,
            user: userData,
        });
    } catch (error) {
       let message = "Internal server error";
        let code = "SERVER_ERROR";
        let status = 500;
        
        if (error.message.includes('Malformed')) {
            message = "Invalid Google token";
            code = "INVALID_TOKEN";
            status = 400;
        }
        
        res.status(status).json({ 
            success: false,
            message,
            code
        });
    }
};

export {
  registerUser,
  loginUser,
  verifyEmail,
  resetPasswordRequest,
  verifyResetPasswordTokenAndResetPassword,
  googleAuth,
};