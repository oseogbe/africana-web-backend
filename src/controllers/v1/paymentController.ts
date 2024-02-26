import { Request, Response } from "express"
import { prisma } from "@/prisma-client"

const Flutterwave = require('flutterwave-node-v3')

const verifyFlwTransaction = async (req: Request, res: Response) => {
    const flw = new Flutterwave(
        process.env.FLW_PUBLIC_KEY as string,
        process.env.FLW_SECRET_KEY as string,
        process.env.APP_ENV === "production"
    )

    if (req.query.status === 'successful') {
        try {
            const payment = await prisma.payment.findUnique({
                where: {
                    reference: req.query.tx_ref as string
                }
            })

            if (!payment) {
                return res.status(500).json({
                    success: false,
                    message: "Transaction reference not found"
                })
            }

            const response = await flw.Transaction.verify({ id: req.query.transaction_id })

            if (
                response.data.status === "successful"
                && response.data.amount == payment?.amount
                && response.data.currency === "NGN"
            ) {
                if (payment.status === "Successful") {
                    return res.json({
                        success: false,
                        message: "Order has already been completed"
                    })
                }

                await prisma.payment.update({
                    where: {
                        reference: req.query.tx_ref as string
                    },
                    data: {
                        meta: response.data,
                        status: "Successful",
                        completedAt: new Date(),
                    }
                })


                const order = await prisma.order.update({
                    where: {
                        id: payment.orderId
                    },
                    data: {
                        status: "Completed"
                    },
                    select: {
                        orderItems: true
                    }
                })

                if (order) {
                    order.orderItems.map(async (item: any) => {
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
                    })

                    res.json({
                        success: true,
                        message: "Order completed"
                    })
                }

            } else {
                await prisma.order.update({
                    where: {
                        id: payment.orderId
                    },
                    data: {
                        status: "Failed"
                    },
                    select: {
                        orderItems: true
                    }
                })
                res.json({
                    success: false,
                    message: "Order failed"
                })
            }

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "An error occurred"
            })
        }
    }
}

export {
    verifyFlwTransaction
}