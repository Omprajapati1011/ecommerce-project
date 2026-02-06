import express from "express"
const router = express.Router();
import {Order_master,AllOrder,singleOrder} from "../controllers/Order_master.controller.js"

router.post('/order',Order_master)
router.get('/order',AllOrder)
router.get('/order/:id',singleOrder)

export default router;