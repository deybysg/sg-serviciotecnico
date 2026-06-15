import { Router } from "express";
import { obtenerServicios, obtenerServicio, crearServicio, actualizarServicio, marcarEntregado, eliminarServicio, agregarSeguimiento } from "../controllers/servicios.controllers.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { isPostgres } from "../config/dbProvider.js";
import * as pgCtrl from "../controllers_pg/servicios.controllers.js";

const ctrl = isPostgres() ? pgCtrl : { obtenerServicios, obtenerServicio, crearServicio, actualizarServicio, marcarEntregado, eliminarServicio, agregarSeguimiento };

const router = Router();

router.get("/", authenticate, authorize("admin", "superadmin"), ctrl.obtenerServicios);
router.get("/:id", authenticate, authorize("admin", "superadmin"), ctrl.obtenerServicio);
router.post("/", authenticate, authorize("admin", "superadmin"), ctrl.crearServicio);
router.put("/:id", authenticate, authorize("admin", "superadmin"), ctrl.actualizarServicio);
router.patch('/:id/seguimiento', authenticate, authorize("admin", "superadmin"), ctrl.agregarSeguimiento);
router.patch("/:id/entregar", authenticate, authorize("admin", "superadmin"), ctrl.marcarEntregado);
router.delete("/:id", authenticate, authorize("admin", "superadmin"), ctrl.eliminarServicio);

export default router;
