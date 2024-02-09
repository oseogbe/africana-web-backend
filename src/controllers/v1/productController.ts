import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '@/prisma-client'
import { getAmount, setAmount, slugify } from '@/lib/helpers'
import { logger } from '@/lib/logger'

const getProducts = async (req: Request, res: Response) => {
    try {
        logger.info("getting products")
        const products = await prisma.product.findMany({
            include: {
                productVariants: true,
                productImages: true,
            }
        })

        logger.info("products with variants and images")

        const updatedProducts = products.map(product => {
            const updatedVariants = product.productVariants.map(variant => {
                const oldPrice = variant.oldPrice ? getAmount(variant.oldPrice) : null
                return { ...variant, price: getAmount(variant.price), oldPrice }
            })

            return { ...product, productVariants: updatedVariants }
        })

        return res.json({
            success: true,
            products: updatedProducts
        })
    } catch (error) {
        logger.error(error)
    }
}

const createProduct = async (req: Request, res: Response) => {
    try {
        const categories: number[] = req.body.categories
        const tags: number[] = req.body.tags
        const productVariants: Prisma.ProductVariantCreateInput[] = req.body.productVariants
        const productImages: Prisma.ProductImageCreateInput[] = req.body.productImages

        const product = await prisma.product.create({
            data: {
                name: req.body.name,
                slug: slugify(req.body.name),
                description: req.body.description,
                currencyId: req.body.currency ?? 1,
                lowOnStockMargin: req.body.lowOnStockMargin,
                productVariants: {
                    create: [
                        ...productVariants.map(variant => ({
                            ...variant,
                            price: setAmount(variant.price),
                            oldPrice: variant.oldPrice ? setAmount(variant.oldPrice) : null,
                        }))
                    ],
                },
                productImages: {
                    create: [
                        ...productImages
                    ],
                },
            }
        })

        const productCategoriesAndTags = await prisma.product.update({
            where: { id: product.id },
            data: {
                categories: {
                    connect: [
                        ...categories.map(category => ({
                            id: category,
                        }))
                    ],
                },
                tags: {
                    connect: [
                        ...tags.map(tag => ({
                            id: tag,
                        }))
                    ],
                }
            }
        })

        return res.json({
            success: true,
            message: "New product added",
            product: { ...product, ...productCategoriesAndTags }
        })
    } catch (error) {
        logger.error(error)
    }
}

const getProduct = async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.findUnique({
            where: {
                slug: req.params.slug
            },
            include: {
                productVariants: true,
                productImages: true,
                categories: true,
                tags: true,
            }
        })

        const updatedVariants = product?.productVariants.map(variant => {
            return { ...variant, price: getAmount(variant.price), oldPrice: getAmount(variant.price) }
        })

        const updatedProduct = { ...product, productVariants: updatedVariants }

        return res.json({
            success: true,
            product: updatedProduct
        })
    } catch (error) {
        logger.error(error)
    }
}

const updateProduct = async (req: Request, res: Response) => {
    try {
        const categories: number[] = req.body.categories
        const tags: number[] = req.body.tags
        const productVariants: Prisma.ProductVariantCreateInput[] = req.body.productVariants
        const productImages: Prisma.ProductImageCreateInput[] = req.body.productImages

        const slug = req.params.slug

        const existingProduct = await prisma.product.findUnique({
            where: { slug },
        })

        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            })
        }

        const newSlug = slugify(req.body.name)
        const isSlugNotAvailable = await prisma.product.findUnique({
            where: {
                slug: newSlug,
                NOT: { slug }
            },
        })

        if (isSlugNotAvailable) {
            return res.status(400).json({
                success: false,
                message: "Product already exists",
            })
        }

        const product = await prisma.product.update({
            where: {
                slug
            },
            data: {
                name: req.body.name,
                slug: newSlug,
                description: req.body.description,
                currencyId: req.body.currency ?? 1,
                lowOnStockMargin: req.body.lowOnStockMargin,
                productVariants: {
                    upsert: productVariants.map(variant => ({
                        where: { sku: variant.sku },
                        update: {
                            ...variant,
                            price: setAmount(variant.price),
                            oldPrice: variant.oldPrice ? setAmount(variant.oldPrice) : null,
                        },
                        create: {
                            ...variant,
                            price: setAmount(variant.price),
                            oldPrice: variant.oldPrice ? setAmount(variant.oldPrice) : null,
                        }
                    }))
                },
                productImages: {
                    upsert: productImages.map(image => ({
                        where: { url: image.url },
                        update: { ...image },
                        create: { ...image }
                    }))
                },
                categories: {
                    set: categories.map(category => ({ id: category }))
                },
                tags: {
                    set: tags.map(tag => ({ id: tag }))
                },
            }
        })

        return res.json({
            success: true,
            message: "Product updated",
            product
        })
    } catch (error) {
        logger.error(error)
    }
}

const deleteProduct = async (req: Request, res: Response) => {
    try {
        await prisma.product.delete({
            where: {
                slug: req.params.slug
            }
        })

        return res.json({
            success: true,
            message: "Product deleted"
        })
    } catch (error) {
        logger.error(error)
    }
}

export {
    getProducts,
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct
}