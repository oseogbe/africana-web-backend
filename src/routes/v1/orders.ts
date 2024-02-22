import express from 'express'
import { body } from 'express-validator'
import { prisma } from '@/prisma-client'
import { createOrder, getCustomerOrders, getOrders } from '@/controllers/v1/orderController'
import { validateInput } from '@/middleware/validate'
import { authenticateToken, isAdmin } from '@/middleware/authenticate'

const router = express.Router()

router.post(
    '/create',
    authenticateToken,
    [
        body('subTotal').isNumeric(),
        body('taxId').isNumeric(),
        body('total').isNumeric(),
        body('address1').isString().trim().notEmpty().withMessage('Address 1 required'),
        body('address2').optional().isString().trim(),
        body('postalCode').isNumeric(),
        body('city').isString().trim().notEmpty().withMessage('City required'),
        body('state').isString().trim().notEmpty().withMessage('State required'),
        body('country').isString().trim().notEmpty().withMessage('Country required'),
        body('notes').optional().isString().trim(),
        body('orderItems').isArray({ min: 1 }).withMessage('Order items required'),
        body('orderItems.*.productVariantId').isString().trim().notEmpty().withMessage('Product variant id required')
            .custom(async (value) => {
                const productVariant = await prisma.productVariant.findUnique({
                    where: { id: value }
                })
                if (!productVariant) {
                    throw new Error('Product variant does not exist')
                }
            }),
        body('orderItems.*.pricePerItem').isNumeric(),
        body('orderItems.*.quantity').isNumeric(),
        validateInput,
    ],
    createOrder
)

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