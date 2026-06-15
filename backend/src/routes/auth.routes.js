import { Router } from "express";
import { login, register, getProfile, forgotPassword, resetPassword } from "../controllers/auth.controllers.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { isPostgres } from "../config/dbProvider.js";
import * as pgCtrl from "../controllers_pg/auth.controllers.js";

const ctrl = isPostgres() ? pgCtrl : { login, register, getProfile, forgotPassword, resetPassword };

const router = Router();

router.post("/login", ctrl.login);
router.post("/register", ctrl.register);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);

router.get("/me", authenticate, ctrl.getProfile);

export default router;
