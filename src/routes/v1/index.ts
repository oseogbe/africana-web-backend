import express from 'express'
import auth from '@/routes/v1/auth'
import categories from '@/routes/v1/categories'
import products from '@/routes/v1/products'

const router = express.Router()

router.use('/auth', auth)
router.use('/categories', categories)
router.use('/products', products)

export default router