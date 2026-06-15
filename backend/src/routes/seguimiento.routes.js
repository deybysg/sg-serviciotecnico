import { Router } from 'express';
import { obtenerServicioPublico } from '../controllers/seguimiento.controllers.js';
import { isPostgres } from "../config/dbProvider.js";
import * as pgCtrl from "../controllers_pg/seguimiento.controllers.js";

const ctrl = isPostgres() ? pgCtrl : { obtenerServicioPublico };

const router = Router();

router.get('/:id', ctrl.obtenerServicioPublico);

export default router;
