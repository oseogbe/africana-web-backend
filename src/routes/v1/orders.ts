import express from 'express'
import { getOrders, getCustomerOrders } from '@/controllers/v1/orderController'
import { authenticateToken, isAdmin } from '@/middleware/authenticate'

const router = express.Router()

router.get(
    '/all',
    authenticateToken,
    isAdmin,
    getOrders
)

router.get(
    '/',
    authenticateToken,
    getCustomerOrders
)

export default router