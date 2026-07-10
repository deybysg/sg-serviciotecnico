import { Router } from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { isPostgres } from "../config/dbProvider.js";
import * as mongoCtrl from "../controllers/ajustes.controllers.js";
import * as pgCtrl from "../controllers_pg/ajustes.controllers.js";

const ctrl = isPostgres() ? pgCtrl : mongoCtrl;

const router = Router();

// GET ajustes - admin/superadmin
router.get("/", authenticate, authorize("admin", "superadmin"), ctrl.obtenerAjustes);
router.get("/producto/:productoId", authenticate, authorize("admin", "superadmin"), ctrl.obtenerAjustesPorProducto);

// POST ajuste - admin/superadmin
router.post("/", authenticate, authorize("admin", "superadmin"), ctrl.crearAjuste);

export default router;
