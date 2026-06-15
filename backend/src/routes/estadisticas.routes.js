import { Router } from "express";
import { 
  estadisticasVentasPorCategoria, 
  estadisticasVentasPorMes,
  estadisticasServiciosPorTipo,
  estadisticasServiciosPorMes,
  resumenGeneral
} from "../controllers/estadisticas.controllers.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { isPostgres } from "../config/dbProvider.js";
import * as pgCtrl from "../controllers_pg/estadisticas.controllers.js";

const ctrl = isPostgres() ? pgCtrl : { estadisticasVentasPorCategoria, estadisticasVentasPorMes, estadisticasServiciosPorTipo, estadisticasServiciosPorMes, resumenGeneral };

const router = Router();

router.get("/resumen", authenticate, authorize("admin", "superadmin"), ctrl.resumenGeneral);
router.get("/ventas/categorias", authenticate, authorize("admin", "superadmin"), ctrl.estadisticasVentasPorCategoria);
router.get("/ventas/meses", authenticate, authorize("admin", "superadmin"), ctrl.estadisticasVentasPorMes);
router.get("/servicios/tipos", authenticate, authorize("admin", "superadmin"), ctrl.estadisticasServiciosPorTipo);
router.get("/servicios/meses", authenticate, authorize("admin", "superadmin"), ctrl.estadisticasServiciosPorMes);

export default router;
