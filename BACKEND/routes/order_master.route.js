import express from "express"
const router = express.Router();
import {Order_master,AllOrder,singleOrder} from "../controllers/Order_master.controller.js"
import {auth} from "../middlewares/auth.middleware.js"

router.post('/order',auth,Order_master)
router.get('/order',auth,AllOrder)
router.get('/order/:id',auth,singleOrder)


export default router;
