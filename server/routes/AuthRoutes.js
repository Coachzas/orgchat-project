import { Router } from "express";
import {
  registerUser,
  loginUser,
  getAllUsers,
  logoutUser,         
  getCurrentUser,
  generateToken,
} from "../controllers/AuthController.js";

const router = Router();

router.post("/register", registerUser); 
router.post("/login", loginUser);
router.get("/get-contacts", getAllUsers);
router.post("/logout", logoutUser);
router.get("/me", getCurrentUser);
router.get("/generate-token/:userId", generateToken);

export default router;
