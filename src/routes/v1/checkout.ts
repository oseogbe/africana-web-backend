import express from "express"
import { body } from "express-validator"
import { prisma } from '@/prisma-client'
import { CheckoutItem, checkout } from "@/controllers/v1/checkoutController"
import { validateInput } from "@/middleware/validate"

const router = express.Router()

router.post(
    '/',
    [
        body('customer').isObject(),
        body('customer.firstName').isString().trim().notEmpty().withMessage('First name required'),
        body('customer.lastName').isString().trim().notEmpty().withMessage('Last name required'),
        body('customer.email').isString().trim().notEmpty().withMessage('Email required'),
        body('customer.phone').optional().isString().trim(),
        body('customer.address1').isString().trim().notEmpty().withMessage('Address 1 required'),
        body('customer.address2').optional().isString().trim(),
        body('customer.postalCode').isNumeric(),
        body('customer.city').isString().trim().notEmpty().withMessage('City required'),
        body('customer.state').isString().trim().notEmpty().withMessage('State required'),
        body('customer.country').isString().trim().notEmpty().withMessage('Country required'),
        body('customer.notes').optional().isString().trim(),
        body('orderItems').isArray({ min: 1 }).withMessage('Order items required'),
        body('orderItems.*.productVariantId').isString().trim().notEmpty().withMessage('Product variant id required')
            .custom(async (value, { req }) => {
                const orderItemIndex = req.body.orderItems.findIndex((item: CheckoutItem) => item.productVariantId === value)
                const quantity = req.body.orderItems[orderItemIndex].quantity
                const variant = await prisma.productVariant.findFirst({
                    where: {
                        id: value,
                        quantity: {
                            gte: quantity
                        }
                    }
                })
                if (!variant) {
                    throw new Error('Product variant ordered exceeds available quantity')
                }
                return true
            }),
        body('orderItems.*.quantity').isNumeric(),
        body('taxId').isNumeric(),
        body('paymentMethod').isIn(['flutterwave', 'paystack']).withMessage('Invalid payment method')
    ],
    validateInput,
    checkout
)

export default router