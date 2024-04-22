const Flutterwave = require('flutterwave-node-v3')

import axios from "axios"
import { prisma } from "@/prisma-client"

import PaymentProvider from "@/interfaces/PaymentProvider"
import { generateRandomStringWithoutSymbols } from "@/lib/helpers"


class FlutterwavePaymentProvider implements PaymentProvider {
    private flw

    constructor() {
        this.flw = new Flutterwave(
            process.env.FLW_PUBLIC_KEY as string,
            process.env.FLW_SECRET_KEY as string,
            process.env.APP_ENV === "production"
        )
    }

    async initiatePayment(email: string, orderId: string, amount: number) {
        const headers = {
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
            'Content-Type': 'application/json',
        }

        const tx_ref = generateRandomStringWithoutSymbols(12)

        const requestBody = {
            tx_ref,
            amount,
            currency: 'NGN',
            redirect_url: `${process.env.FRONTEND_URL}/order/complete`,
            payment_options: 'card',
            customer: {
                email,
            },
            meta: {
                provider: "flutterwave"
            },
            customizations: {
                title: 'Africana Couture',
                description: 'Payment of order items from Africana e-commerce',
                logo: `${process.env.APP_URL}/img/africana-logo.png`
            },
        }

        const currency = await prisma.currency.findUnique({
            where: {
                code: 'NGN'
            }
        })

        if (!currency) {
            throw new Error('Currency not found')
        }

        await prisma.payment.create({
            data: {
                orderId,
                channel: "Flutterwave",
                reference: tx_ref,
                amount,
                currencyId: currency.id,
                meta: {},
            }
        })

        return await axios.post('https://api.flutterwave.com/v3/payments', requestBody, { headers })
    }

    async verifyTransaction(transactionId: string) {
        const payment = await prisma.payment.findUnique({
            where: {
                reference: transactionId
            }
        })

        if (!payment) {
            throw new Error("Transaction reference not found")
        }

        const response = await this.flw.Transaction.verify({ id: transactionId })

        if (
            response.data.status === "successful"
            && response.data.amount == payment?.amount
            && response.data.currency === "NGN"
        ) {
            if (payment.status === "Successful") {
                throw new Error("Order has already been completed")
            }

            await prisma.payment.update({
                where: {
                    reference: transactionId
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

                return "Order completed"
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

            throw new Error("Payment failed")
        }
    }
}

export default FlutterwavePaymentProvider