import express from "express";
import { loginUser, registerUser, registerWithGoogle } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/google", registerWithGoogle);
router.post("/login", loginUser);

export default router;
