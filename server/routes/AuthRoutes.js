import { Router } from "express";
import multer from "multer";
import {
  registerUser,
  loginUser,
  getAllUsers,
  logoutUser,
  getCurrentUser,
  generateToken,
  changePassword,
  updateProfilePhoto,
} from "../controllers/AuthController.js";
import { isAuthenticated } from "../middlewares/AuthMiddleware.js";

const router = Router();
const uploadImage = multer({ dest: "uploads/images/" });

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/get-contacts", getAllUsers);
router.post("/logout", logoutUser);
router.get("/me", getCurrentUser);
router.get("/generate-token/:userId", generateToken);

// change password (must be authenticated)
router.post("/change-password", isAuthenticated, changePassword);

// upload/update profile photo (multipart/form-data)
router.post("/profile-photo", isAuthenticated, uploadImage.single("image"), updateProfilePhoto);

export default router;
