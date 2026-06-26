// backend/src/routes/mercadopago.routes.js

import express from 'express';
import { createPreference, createQR, webhook } from '../controllers/mercadopago.controllers.js';
import { isPostgres } from "../config/dbProvider.js";
import * as pgCtrl from "../controllers_pg/mercadopago.controllers.js";

const ctrl = isPostgres() ? pgCtrl : { createPreference, createQR, webhook };

const router = express.Router();

router.post('/create-preference', ctrl.createPreference);
router.post('/create-qr', ctrl.createQR);
router.post('/webhook', ctrl.webhook);

export default router;
