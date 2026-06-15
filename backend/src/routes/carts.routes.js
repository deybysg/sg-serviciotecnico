import { Router } from "express";
import { obtenerCarrito, upsertCarrito, limpiarCarrito, limpiarTodosLosCarritos } from "../controllers/carts.controllers.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { isPostgres } from "../config/dbProvider.js";
import * as pgCtrl from "../controllers_pg/carts.controllers.js";

const ctrl = isPostgres() ? pgCtrl : { obtenerCarrito, upsertCarrito, limpiarCarrito, limpiarTodosLosCarritos };

const router = Router();

router.get("/", authenticate, ctrl.obtenerCarrito);
router.post("/", authenticate, ctrl.upsertCarrito);
router.put("/", authenticate, ctrl.upsertCarrito);
router.patch("/limpiar", authenticate, ctrl.limpiarCarrito);
router.patch("/:username/limpiar", authenticate, ctrl.limpiarCarrito);
router.patch("/reset-all", authenticate, authorize('superadmin'), ctrl.limpiarTodosLosCarritos);

export default router;
