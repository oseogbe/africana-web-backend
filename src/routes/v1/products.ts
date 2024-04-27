import express from 'express'
import { body, query } from 'express-validator'
import multer from 'multer'
import { prisma } from '@/prisma-client'
import {
    getProducts,
    createProduct,
    getProduct,
    deleteProduct,
    updateProduct,
    getProductViews,
    updateProductViews,
} from '@/controllers/v1/productController'
import { addReview, deleteProductReview } from '@/controllers/v1/productReviewController'
import { authenticateToken, isAdmin } from '@/middleware/authenticate'
import { validateInput } from '@/middleware/validate'

const router = express.Router()

router.get('/views', getProductViews)

router.get(
    '/',
    [
        query('search').optional().isString().trim(),
        query('minPrice').optional().isNumeric(),
        query('maxPrice').optional().isNumeric(),
        query('categorySlug').optional().isString().trim(),
        query('tagSlug').optional().isString().trim(),
        query('color').optional().isString().trim(),
        query('page').optional().isNumeric().custom((value) => {
            if (parseInt(value, 10) < 1) {
                throw new Error('Page must be greater than or equal to 1');
            }
            return true;
        }),
        query('limit').optional().isNumeric(),
        query('latest').optional().isBoolean(),
        validateInput,
    ],
    getProducts
)

const upload = multer({
    dest: 'public/',
    limits: {
        files: 10,
        fileSize: 2097152,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png' || 
            file.mimetype === 'image/jpeg' || 
            file.mimetype === 'image/jpg') {
            cb(null, true)
        } else {
            cb(null, false)
            const err = new Error('Only .jpg, .jpeg and .png images are supported!')
            err.name = 'ExtensionError'
            return cb(err)
        }
    }
})

router.post(
    '/create',
    upload.array('productImages'),
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
        body('lowOnStockMargin').isNumeric().withMessage('Low on stock margin required'),
        body('categories.*').isNumeric(),
        // body('tags.*').isNumeric(),
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
        validateInput,
    ],
    createProduct
)

router.get('/:slug', getProduct)

router.get('/:slug/set-view-count', updateProductViews)

router.put(
    '/:slug',
    [
        body('name').isString().trim().notEmpty().withMessage('Name required'),
        body('description').isString().trim().notEmpty().withMessage('Description required'),
        body('currencyId').isNumeric().withMessage('Currency required'),
        body('lowOnStockMargin').isNumeric().withMessage('Low on stock margin required'),
        body('categories.*').isNumeric(),
        // body('tags.*').isNumeric(),
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

router.post(
    '/:slug/add-review',
    [
        body('comment').isString().trim().notEmpty().withMessage('Comment required'),
        body('stars').optional().isInt({ min: 1, max: 5 }),
        validateInput,
    ],
    authenticateToken,
    addReview
)

router.delete(
    '/:reviewId/delete-review',
    authenticateToken,
    isAdmin,
    deleteProductReview
)

router.delete('/:slug', deleteProduct)

export default router