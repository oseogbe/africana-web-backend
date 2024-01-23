import { getAmount, setAmount, slugify } from '@/lib/helpers'
import { logger } from '@/lib/logger'
import { PrismaClient, Prisma } from '@prisma/client'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

const getProducts = async (req: Request, res: Response) => {
    const products = await prisma.product.findMany({
        include: {
            productVariants: true,
            productImages: true,
        }
    })

    // use getAmount on product variants' price

    return res.json({
        success: true,
        products
    })
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
    } finally {
        await prisma.$disconnect
    }
}

export {
    getProducts,
    createProduct
}