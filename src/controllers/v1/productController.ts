import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '@/prisma-client'
import slugify from '@sindresorhus/slugify';
import { logger } from '@/lib/logger'

const getProducts = async (req: Request, res: Response) => {
    try {
        const {
            search,
            minPrice,
            maxPrice,
            categorySlug,
            tagSlug,
            color,
            page,
            limit,
            latest,
        } = req.query

        // TODO: front-end should display out-of-stock products

        let where = {}

        if (search) {
            where = {
                ...where,
                name: {
                    contains: search
                }
            }
        }

        if (minPrice && maxPrice) {
            where = {
                ...where,
                productVariants: {
                    some: {
                        price: {
                            gte: parseInt(minPrice as string, 10),
                            lte: parseInt(maxPrice as string, 10)
                        }
                    }
                }
            }
        }

        if (categorySlug) {
            where = {
                ...where,
                categories: {
                    some: {
                        slug: categorySlug as string
                    }
                }
            }
        }

        if (tagSlug) {
            where = {
                ...where,
                tags: {
                    some: {
                        slug: tagSlug as string
                    }
                }
            }
        }


        if (color) {
            where = {
                ...where,
                productVariants: {
                    some: {
                        color: color as string
                    }
                }
            }
        }

        if (latest) {
            where = {
                ...where,
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }

        const take = parseInt(limit as string, 10) || 16
        const skip = page ? (parseInt(page as string, 10) * take) - take : 0

        const products = await prisma.product.findMany({
            where,
            include: {
                productVariants: true,
                productImages: true,
            },
            take,
            skip,
        })

        // const updatedProducts = products.map(product => {
        //     const updatedVariants = product.productVariants.map(variant => {
        //         const oldPrice = variant.oldPrice ? getAmount(variant.oldPrice) : null
        //         return { ...variant, price: getAmount(variant.price), oldPrice }
        //     })

        //     return { ...product, productVariants: updatedVariants }
        // })

        const totalProducts = await prisma.product.count({
            where,
        })

        res.json({
            success: true,
            total: totalProducts,
            products
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
                    // create: [
                    //     ...productVariants.map(variant => ({
                    //         ...variant,
                    //         price: setAmount(variant.price),
                    //         oldPrice: variant.oldPrice ? setAmount(variant.oldPrice) : null,
                    //     }))
                    // ],
                    create: productVariants
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

        // const updatedVariants = product?.productVariants.map(variant => {
        //     return { ...variant, price: getAmount(variant.price), oldPrice: getAmount(variant.price) }
        // })

        // const updatedProduct = { ...product, productVariants: updatedVariants }

        return res.json({
            success: true,
            product
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
                        update: variant,
                        create: variant
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