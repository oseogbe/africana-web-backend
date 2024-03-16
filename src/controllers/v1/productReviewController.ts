import { Request, Response } from "express";
import { prisma } from "@/prisma-client"

const addReview = async (req: Request, res: Response) => {
    const customer = await prisma.customer.findUnique({ where: { email: req.user } })
    const productSlug = req.params.slug as string

    const hasPurchasedProduct = await prisma.order.findMany({
        where: {
            customerId: customer?.id,
            orderItems: {
                some: {
                    productVariant: {
                        product: {
                            slug: productSlug
                        }
                    }
                }
            }
        }
    })

    if (hasPurchasedProduct.length > 0) {
        await prisma.productReview.create({
            data: {
                product: {
                    connect: {
                        slug: productSlug
                    }
                },
                comment: req.body.comment as string,
                stars: req.body.stars as number
            }
        })

        return res.json({
            success: true,
            message: "Comment added"
        })
    }

    return res.json({
        success: true,
        message: "Comment can only be added for purchased products"
    })
}


const deleteProductReview = async (req: Request, res: Response) => {
    await prisma.productReview.delete({
        where: {
            id: req.params.reviewId
        }
    })

    return res.json({
        success: true,
        message: "Product review deleted"
    })
}

export {
    addReview,
    deleteProductReview
}