import express from "express"
const router_Item = express.Router();
import {  getAllOrderItem,postOrderItems,getOneItem} from "../controllers/Order_item.controller.js";

router_Item.get('/orders/:orderId/items',getAllOrderItem)
router_Item.get('/orders/:orderId/items/:itemId',getOneItem)
router_Item.post('/orders/:orderId/items',postOrderItems)

export default router_Item;