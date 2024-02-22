import { Request, Response } from 'express'
import { prisma } from '@/prisma-client'
import { generateRandomStringWithoutSymbols } from '@/lib/helpers'
import { logger } from '@/lib/logger'

const createOrder = async (req: Request, res: Response) => {
    const {
        subTotal,
        taxId,
        total,
        address1,
        address2,
        postalCode,
        city,
        state,
        country,
        notes,
        orderItems
    } = req.body

    const customer = await prisma.customer.findUnique({ where: { email: req.user } })

    if (!customer) {
        return res.sendStatus(401)
    }

    try {
        const order = await prisma.order.create({
            data: {
                code: generateRandomStringWithoutSymbols(12),
                customerId: customer.id,
                subTotal,
                taxId,
                total,
                address1,
                address2,
                postalCode,
                city,
                state,
                country,
                notes,
                orderItems: {
                    create: orderItems
                }
            },

        })

        Promise.all(orderItems.map(async (item: any) => {
            await prisma.productVariant.update({
                where: {
                    id: item.productVariantId
                },
                data: {
                    quantity: {
                        decrement: item.quantity
                    }
                }
            })
        }))

        // TODO: send notification if product has reached low on stock level

        res.status(201).json({
            success: true,
            message: "New order created",
        })
    } catch (error) {
        logger.error(error)
        res.status(500).json({
            success: false,
            message: 'An error occurred!',
        })
    }
}

const getOrders = async (req: Request, res: Response) => {
    const orders = await prisma.order.findMany({
        select: {
            code: true,
            customer: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    address1: true,
                    address2: true,
                    city: true,
                    state: true,
                    country: true,
                }
            },
            status: true,
            subTotal: true,
            tax: {
                select: {
                    value: true,
                    type: true,
                }
            },
            total: true,
            notes: true,
            createdAt: true,
            orderItems: {
                select: {
                    pricePerItem: true,
                    quantity: true,
                    productVariant: {
                        select: {
                            product: {
                                select: {
                                    name: true,
                                    slug: true,
                                    productImages: {
                                        select: {
                                            url: true
                                        }
                                    }
                                }
                            },
                            size: true,
                            color: true,
                        }
                    },
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    })

    res.json({
        success: true,
        orders,
    })
}

const getCustomerOrders = async (req: Request, res: Response) => {
    const customer = await prisma.customer.findUnique({ where: { email: req.user } })

    if (!customer) {
        return res.sendStatus(401)
    }

    const orders = await prisma.order.findMany({
        where: {
            customerId: customer.id
        },
        select: {
            code: true,
            status: true,
            subTotal: true,
            tax: {
                select: {
                    value: true,
                    type: true,
                }
            },
            total: true,
            notes: true,
            createdAt: true,
            orderItems: {
                select: {
                    pricePerItem: true,
                    quantity: true,
                    productVariant: {
                        select: {
                            product: {
                                select: {
                                    name: true,
                                    slug: true,
                                    productImages: {
                                        select: {
                                            url: true
                                        }
                                    }
                                }
                            },
                            size: true,
                            color: true,
                        }
                    },
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    })

    res.json({
        success: true,
        orders,
    })
}

export {
    createOrder,
    getOrders,
    getCustomerOrders
}