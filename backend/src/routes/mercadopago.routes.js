// backend/src/routes/mercadopago.routes.js

import express from 'express';
import { createPreference, webhook } from '../controllers/mercadopago.controllers.js';
import { isPostgres } from "../config/dbProvider.js";
import * as pgCtrl from "../controllers_pg/mercadopago.controllers.js";

const ctrl = isPostgres() ? pgCtrl : { createPreference, webhook };

const router = express.Router();

router.post('/create-preference', ctrl.createPreference);
router.post('/webhook', ctrl.webhook);

export default router;
