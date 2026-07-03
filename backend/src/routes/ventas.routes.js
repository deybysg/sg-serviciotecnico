import { Router } from "express";
import { obtenerVentas, obtenerVenta, crearVenta, devolverVenta, obtenerVentasPorUsuario, generarComprobantePDF } from "../controllers/ventas.controllers.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { isPostgres } from "../config/dbProvider.js";
import * as pgCtrl from "../controllers_pg/ventas.controllers.js";

const ctrl = isPostgres() ? pgCtrl : { obtenerVentas, obtenerVenta, crearVenta, devolverVenta, obtenerVentasPorUsuario, generarComprobantePDF };

const router = Router();

router.get("/", authenticate, authorize("admin", "superadmin"), ctrl.obtenerVentas);
router.get("/:id", authenticate, ctrl.obtenerVenta);
router.post("/", authenticate, ctrl.crearVenta);
router.patch("/:id/devolver", authenticate, authorize("admin", "superadmin"), ctrl.devolverVenta);
router.get("/usuario/:username", authenticate, ctrl.obtenerVentasPorUsuario);
router.get("/comprobante/:id/pdf", authenticate, ctrl.generarComprobantePDF);

export default router;
