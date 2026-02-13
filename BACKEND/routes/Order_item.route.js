import express from "express"
const router_Item = express.Router();
import {  getAllOrderItem,getOneItem} from "../controllers/Order_item.controller.js";
import {auth} from "../middlewares/auth.middleware.js"


router_Item.get('/orders/:orderId/items',auth,getAllOrderItem)
router_Item.get('/orders/:orderId/items/:itemId',auth,getOneItem)

export default router_Item;