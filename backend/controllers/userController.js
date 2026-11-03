import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { sendToken } from "../utils/jwtToken.js";
import cloudinary from "cloudinary";

export const register = catchAsyncErrors(async (req, res, next) => {
  const avatar = req.files?.avatar;
  if (!avatar || Array.isArray(avatar)) {
    return next(new ErrorHandler("Choose one profile photo to continue.", 400));
  }
  if (avatar.truncated || avatar.size > 5 * 1024 * 1024) {
    return next(new ErrorHandler("Your profile photo must be 5 MB or smaller.", 413));
  }

  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(avatar.mimetype)) {
    return next(
      new ErrorHandler(
        "Choose a JPG, PNG, or WebP image for your profile photo.",
        400
      )
    );
  }
  const { name, email, password, phone, role, education } = req.body;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password ||
    !phone ||
    !role ||
    !education
  ) {
    return next(new ErrorHandler("Complete all required account details.", 400));
  }
  if (!["Reader", "Author"].includes(role)) {
    return next(new ErrorHandler("Choose Reader or Author as your account role.", 400));
  }
  if (!/^\d{7,15}$/.test(String(phone))) {
    return next(new ErrorHandler("Enter a phone number containing 7 to 15 digits.", 400));
  }
  if (password.length < 8 || password.length > 32) {
    return next(new ErrorHandler("Your password must be between 8 and 32 characters.", 400));
  }

  const normalizedEmail = email.trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });
  if (user) {
    return next(new ErrorHandler("An account with this email already exists.", 409));
  }

  let cloudinaryResponse;
  try {
    cloudinaryResponse = await cloudinary.uploader.upload(avatar.tempFilePath, {
      folder: "openblogs/avatars",
      resource_type: "image",
    });
  } catch (error) {
    console.error("Avatar image upload failed:", error.message);
    return next(
      new ErrorHandler("We couldn't upload your photo. Please try again in a moment.", 502)
    );
  }
  if (!cloudinaryResponse?.secure_url || !cloudinaryResponse.public_id) {
    console.error("Avatar image upload failed: Cloudinary returned no image.");
    return next(
      new ErrorHandler("We couldn't save your photo. Please try again in a moment.", 502)
    );
  }

  user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone,
    role,
    education,
    avatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });
  sendToken(user, 200, "User registered successfully", res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;
  if (typeof email !== "string" || !email.trim() || !password || !role) {
    return next(new ErrorHandler("Enter your email, password, and account role.", 400));
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password!", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 400));
  }
  if (user.role !== role) {
    return next(
      new ErrorHandler(
        `This account is registered as ${user.role}. Choose the matching role to sign in.`,
        400
      )
    );
  }
  sendToken(user, 200, "User logged in successfully", res);


});

export const logout = (req, res, next) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    res.status(200).json({ success: true, message: "You have been signed out." });
  } catch (error) {
    next(error);
  }
};



export const getMyProfile = catchAsyncErrors((req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const getAllAuthors = catchAsyncErrors(async (req, res, next) => {
  const authors = await User.find({ role: "Author" });
  res.status(200).json({
    success: true,
    authors,
  });
});

export const requestAuthorAccess = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOneAndUpdate(
    { _id: req.user._id, role: { $in: ["Reader", "Author"] } },
    { $set: { role: "Author" } },
    { new: true, runValidators: true }
  );
  if (!user) {
    return next(new ErrorHandler("Unable to enable author access for this account.", 409));
  }
  res.status(200).json({
    success: true,
    message: "Author access enabled. You can now write your first story.",
    user,
  });
});
