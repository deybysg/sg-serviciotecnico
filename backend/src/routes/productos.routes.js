import { Router } from "express";
import { validarProducto } from "../helpers/validarProducto.js";
import { resultadoValidacion } from "../helpers/resultadoValidacion.js";
import { isPostgres } from "../config/dbProvider.js";
import * as mongoCtrl from "../controllers/productos.controllers.js";
import * as pgCtrl from "../controllers_pg/productos.controllers.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const ctrl = isPostgres() ? pgCtrl : mongoCtrl;

const router = Router();

// GET productos - público (todos pueden ver)
router.get("/", ctrl.obtenerProductos);
router.get("/nuevos", authenticate, authorize("admin", "superadmin"), ctrl.obtenerProductosNuevos);
router.get("/:id", ctrl.obtenerProducto);

// POST, PUT, DELETE - solo admin/superadmin
router.post("/", authenticate, authorize("admin", "superadmin"), validarProducto, resultadoValidacion, ctrl.crearProducto);
router.put("/:id", authenticate, authorize("admin", "superadmin"), validarProducto, resultadoValidacion, ctrl.actualizarProducto);
router.delete("/:id", authenticate, authorize("admin", "superadmin"), ctrl.eliminarProducto);

// PATCH stock - usuarios autenticados pueden actualizar stock (para compras)
router.patch("/:id/stock", authenticate, ctrl.actualizarProducto);

export default router;