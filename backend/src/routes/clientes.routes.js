import { Router } from "express";
import { obtenerClientes, obtenerCliente, crearCliente, actualizarCliente, eliminarCliente } from "../controllers/clientes.controllers.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { isPostgres } from "../config/dbProvider.js";
import * as pgCtrl from "../controllers_pg/clientes.controllers.js";

const ctrl = isPostgres() ? pgCtrl : { obtenerClientes, obtenerCliente, crearCliente, actualizarCliente, eliminarCliente };

const router = Router();

router.get("/", authenticate, authorize("admin", "superadmin"), ctrl.obtenerClientes);
router.get("/:id", authenticate, authorize("admin", "superadmin"), ctrl.obtenerCliente);
router.post("/", authenticate, authorize("admin", "superadmin"), ctrl.crearCliente);
router.put("/:id", authenticate, authorize("admin", "superadmin"), ctrl.actualizarCliente);
router.delete("/:id", authenticate, authorize("admin", "superadmin"), ctrl.eliminarCliente);

export default router;
