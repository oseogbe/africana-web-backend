import { Request, Response } from "express"
import { prisma } from "@/prisma-client"

const addToCart = async (req: Request, res: Response) => {
    const sessionId = req.cookies["africana_session_id"]

    if (!sessionId) {
        return res.json({
            success: false,
            cart: "User session does not exist!"
        })
    }

    const { productVariantId, quantity } = req.query

    const cart = await prisma.cart.upsert({
        where: { user: sessionId },
        update: {},
        create: {
            user: sessionId,
            expiresAt: new Date(new Date().getTime() + (24 * 60 * 60 * 1000)),
        },
    })

    const productVariant = await prisma.productVariant.findUnique({
        where: {
            id: productVariantId as string,
            quantity: {
                gte: parseInt(quantity as string, 10)
            }
        }
    })

    if (productVariant) {
        await prisma.cartItem.upsert({
            where: {
                cartId_productVariantId: {
                    cartId: cart.id,
                    productVariantId: productVariantId as string
                }
            },
            update: {
                quantity: parseInt(quantity as string, 10)
            },
            create: {
                cartId: cart.id,
                pricePerItem: productVariant.price,
                productVariantId: productVariantId as string,
                quantity: parseInt(quantity as string, 10)
            },
        })

        return res.json({
            success: true,
            message: "Cart updated"
        })
    }

    res.json({
        success: false,
        error: "Product does not exist or is out of stock!"
    })
}

const viewCart = async (req: Request, res: Response) => {
    const sessionId = req.cookies["africana_session_id"]

    if (!sessionId) {
        return res.json({
            success: false,
            cart: "User session does not exist!"
        })
    }

    const cart = await prisma.cart.findUnique({
        where: { user: sessionId },
        select: {
            user: true,
            customerId: true,
            cartItem: {
                select: {
                    quantity: true,
                    productVariant: {
                        select: {
                            id: true,
                            price: true,
                            size: true,
                            color: true,
                            product: {
                                select: {
                                    name: true,
                                    slug: true,
                                    productImages: {
                                        where: {
                                            isDefault: true,
                                        },
                                        select: {
                                            url: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    // const updatedCartItems = cart?.cartItem.map(item => {
    //     return { ...item, productVariant: { ...item.productVariant, price: getAmount(item.productVariant.price) } }
    // })

    // const updatedCart = { ...cart, cartItem: updatedCartItems }

    return res.json({
        success: true,
        cart
    })
}

export {
    addToCart,
    viewCart
}