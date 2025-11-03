// routes/GroupCallRoutes.js
import express from "express";
import { generateGroupCallToken } from "../controllers/GroupCallController.js";
import { isAuthenticated } from "../middlewares/AuthMiddleware.js";

const router = express.Router();
router.get("/token/:userId", isAuthenticated, generateGroupCallToken);
export default router;
