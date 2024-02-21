import express from 'express'
import { query } from 'express-validator'
import { validateInput } from '@/middleware/validate'

import auth from '@/routes/v1/auth'
import categories from '@/routes/v1/categories'
import currencies from '@/routes/v1/currencies'
import products from '@/routes/v1/products'
import taxes from '@/routes/v1/taxes'
import orders from '@/routes/v1/orders'

import { addToCart, viewCart } from '@/controllers/v1/cartController'

const router = express.Router()

router.use('/auth', auth)
router.use('/categories', categories)
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

export default router