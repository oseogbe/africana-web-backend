import axios from "axios"
import { prisma } from "@/prisma-client"

import PaymentProvider from "@/interfaces/PaymentProvider"
import { generateRandomStringWithoutSymbols } from "@/lib/helpers"

class SquadPaymentProvider implements PaymentProvider {
    headers = {
        'Authorization': `Bearer ${process.env.SQUAD_API_KEY}`,
        'Content-Type': 'application/json',
    }

    async initiatePayment(email: string, orderId: string, amount: number) {
        const tx_ref = generateRandomStringWithoutSymbols(12)

        const requestBody = {
            email,
            amount: amount * 100,
            currency: 'USD',
            transaction_ref: tx_ref,
            callback_url: `${process.env.FRONTEND_URL}/order/complete`,
            payment_channels: ['card'],
            initiate_type: 'inline',
            metadata: {
                provider: "squad"
            }
        }

        const currency = await prisma.currency.findUnique({
            where: {
                code: 'USD'
            }
        })

        if (!currency) {
            throw new Error('Currency not found')
        }

        await prisma.payment.create({
            data: {
                orderId,
                channel: "Squadco",
                reference: tx_ref,
                amount,
                currencyId: currency.id,
                meta: {},
            }
        })

        return await axios.post('https://sandbox-api-d.squadco.com/transaction/initiate', requestBody, { headers: this.headers })
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

        const result = await axios.get(`https://sandbox-api-d.squadco.com/transaction/verify/${transactionId}`, { headers: this.headers })

        if (result.data.success) {

            let squadAmount = parseFloat(payment.amount as unknown as string) * 100

            console.log("equals", result.data.transaction_amount, squadAmount)

            if (
                result.data.transaction_amount === squadAmount &&
                result.data.transaction_status === "Success"
            ) {
                if (payment.status === "Successful") {
                    throw new Error("Order has already been completed")
                }

                await prisma.payment.update({
                    where: {
                        reference: transactionId
                    },
                    data: {
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
}

export default SquadPaymentProvider