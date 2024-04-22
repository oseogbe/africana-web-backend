import express from 'express'
import { query } from 'express-validator'
import { validateInput } from '@/middleware/validate'

import auth from '@/routes/v1/auth'
import categories from '@/routes/v1/categories'
import tags from '@/routes/v1/tags'
import currencies from '@/routes/v1/currencies'
import products from '@/routes/v1/products'
import taxes from '@/routes/v1/taxes'
import checkout from '@/routes/v1/checkout'
import orders from '@/routes/v1/orders'

import { addToCart, viewCart } from '@/controllers/v1/cartController'
import { verifyFlwTransaction, verifySquadTransaction } from '@/controllers/v1/paymentController'

const router = express.Router()

router.use('/auth', auth)
router.use('/categories', categories)
router.use('/tags', tags)
router.use('/currencies', currencies)
router.use('/products', products)
router.use('/taxes', taxes)
router.use('/orders', orders)
router.get(
    '/add-to-cart',
    [
        query('productVariantId').isString().trim(),
        query('quantity').isNumeric(),
        validateInput
    ],
    addToCart
)
router.get('/view-cart', viewCart)
router.get('/flutterwave/payment-callback', verifyFlwTransaction)
router.get('/squad/payment-callback', verifySquadTransaction)
router.use('/checkout', checkout)

export default router