import express from 'express'
import { body, query } from 'express-validator'
import { prisma } from '@/prisma-client'
import { getProducts, createProduct, getProduct, deleteProduct, updateProduct } from '@/controllers/v1/productController'
import { authenticateToken } from '@/middleware/authenticate'
import { validateInput } from '@/middleware/validate'

const router = express.Router()

router.get(
    '/',
    [
        query('search').optional().isString().trim(),
        query('minPrice').optional().isNumeric(),
        query('maxPrice').optional().isNumeric(),
        query('categorySlug').optional().isString().trim(),
        query('tagSlug').optional().isString().trim(),
        query('color').optional().isString().trim(),
        validateInput,
    ],
    getProducts
)

router.post(
    '/create',
    [
        body('name').isString().trim().notEmpty().withMessage('Name required')
            .custom(async (value) => {
                const existingProduct = await prisma.product.findFirst({
                    where: { name: value }
                })
                if (existingProduct) {
                    throw new Error('Product already exists')
                }
                return true
            }),
        body('description').isString().trim().notEmpty().withMessage('Description required'),
        body('currencyId').isNumeric().withMessage('Currency required'),
        body('lowOnStockMargin').isNumeric().withMessage('Low on stock margin required'),
        body('categories.*').isNumeric(),
        body('tags.*').isNumeric(),
        body('productVariants').isArray({ min: 1 }).withMessage('Product variants required'),
        body('productVariants.*.sku').isString().trim().notEmpty().withMessage('SKU required')
            .custom(async (value) => {
                const existingProduct = await prisma.productVariant.findUnique({
                    where: { sku: value }
                })
                if (existingProduct) {
                    throw new Error('Product with this SKU already exists')
                }
                return true
            }),
        body('productVariants.*.size')
            .custom((value) => {
                if (typeof value !== 'string' && typeof value !== 'number') {
                    throw new Error('Size must be a string or a number')
                }
                return true
            }),
        body('productVariants.*.color').optional().isString().trim().withMessage('Color required'),
        body('productVariants.*.price').isNumeric().withMessage('Invalid price value'),
        body('productVariants.*.oldPrice').optional().isNumeric().withMessage('Invalid old price value'),
        body('productVariants.*.quantity').isNumeric().withMessage('Quantity required'),
        body('productImages').isArray({ min: 1 }).withMessage('Product images required'),
        body('productImages.*.url').isString().trim().notEmpty().withMessage('Product image url required'),
        body('productImages.*.isDefault').isBoolean(),
        validateInput,
    ],
    createProduct
)

router.get('/:slug', getProduct)

router.put(
    '/:slug',
    [
        body('name').isString().trim().notEmpty().withMessage('Name required'),
        body('description').isString().trim().notEmpty().withMessage('Description required'),
        body('currencyId').isNumeric().withMessage('Currency required'),
        body('lowOnStockMargin').isNumeric().withMessage('Low on stock margin required'),
        body('categories.*').isNumeric(),
        body('tags.*').isNumeric(),
        body('productVariants').isArray({ min: 1 }).withMessage('Product variants required'),
        body('productVariants.*.sku').isString().trim().notEmpty().withMessage('SKU required'),
        body('productVariants.*.size')
            .custom((value) => {
                if (typeof value !== 'string' && typeof value !== 'number') {
                    throw new Error('Size must be a string or a number')
                }
                return true
            }),
        body('productVariants.*.color').optional().isString().trim().withMessage('Color required'),
        body('productVariants.*.price').isNumeric().withMessage('Invalid price value'),
        body('productVariants.*.oldPrice').optional().isNumeric().withMessage('Invalid old price value'),
        body('productVariants.*.quantity').isNumeric().withMessage('Quantity required'),
        body('productImages').isArray({ min: 1 }).withMessage('Product images required'),
        body('productImages.*.url').isString().trim().notEmpty().withMessage('Product image url required'),
        body('productImages.*.isDefault').isBoolean(),
        validateInput,
    ],
    updateProduct
)

router.delete('/:slug', deleteProduct)

export default router