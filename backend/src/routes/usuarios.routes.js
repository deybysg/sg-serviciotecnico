import { Router } from "express";
import {obtenerUsuarios,crearUsuario,actualizarUsuario,eliminarUsuario,obtenerUsuario} from "../controllers/usuarios.controllers.js";
import { validarUsuario, validarUsuarioUpdate } from "../helpers/validarUsuario.js";
import { validationResult } from "express-validator";
import { authenticate, authorize, protectSuperAdmin } from "../middlewares/authMiddleware.js";
import { isPostgres } from "../config/dbProvider.js";
import * as pgCtrl from "../controllers_pg/usuarios.controllers.js";

const ctrl = isPostgres() ? pgCtrl : {
  obtenerUsuarios, obtenerUsuario, crearUsuario, actualizarUsuario, eliminarUsuario
};

const router = Router();

router.get("/", authenticate, authorize("admin", "superadmin"), ctrl.obtenerUsuarios);
router.get("/:id", authenticate, authorize("admin", "superadmin"), ctrl.obtenerUsuario);

router.post("/", authenticate, authorize("admin", "superadmin"), validarUsuario, (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errores: errors.array() });
	}
	ctrl.crearUsuario(req, res, next);
});

router.put("/:id", authenticate, authorize("admin", "superadmin"), protectSuperAdmin, validarUsuarioUpdate, (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errores: errors.array() });
	}
	ctrl.actualizarUsuario(req, res, next);
});

router.delete("/:id", authenticate, authorize("admin", "superadmin"), protectSuperAdmin, ctrl.eliminarUsuario);

export default router;
