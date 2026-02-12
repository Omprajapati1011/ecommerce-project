import express from "express"
const router_Item = express.Router();
import {  getAllOrderItem,getOneItem} from "../controllers/Order_item.controller.js";

router_Item.get('/orders/:orderId/items',getAllOrderItem)
router_Item.get('/orders/:orderId/items/:itemId',getOneItem)

export default router_Item;