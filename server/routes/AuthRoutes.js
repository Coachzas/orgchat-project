import { Router } from "express";
import {
  registerUser,
  loginUser,
  getAllUsers,
  generateToken,
} from "../controllers/AuthController.js";

const router = Router();

router.post("/register", registerUser); 
router.post("/login", loginUser);
router.get("/get-contacts", getAllUsers);
router.get("/generate-token/:userId", generateToken);

export default router;
