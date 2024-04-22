import { Request, Response } from "express"
import axios from "axios"
import { Customer } from "@prisma/client"
import { prisma } from "@/prisma-client"
import PaymentService from "@/services/PaymentService"
import FlutterwavePaymentProvider from "@/providers/FlutterwaveProvider"
import SquadPaymentProvider from "@/providers/SquadProvider"
import { generateRandomStringWithoutSymbols } from "@/lib/helpers"
import { logger } from "@/lib/logger"

export type CheckoutItem = {
    productVariantId: string;
    quantity: number;
}

export const checkout = async (req: Request, res: Response) => {
    try {
        const { customer, orderItems, paymentMethod, taxId } = req.body

        let existingUser = await prisma.customer.findUnique({
            where: { email: customer.email },
        })

        if (!existingUser) {
            const response = await axios.post(`${process.env.APP_URL}/api/v1/auth/register`, {
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email
            })
            existingUser = response.data.customer as Customer
        }

        const subTotal = await calculateSubTotal(orderItems)
        const total = await calculateTotal(subTotal, taxId)

        const orderItemsData = await Promise.all(orderItems.map(async (item: any) => {
            const productVariant = await prisma.productVariant.findUnique({
                where: { id: item.productVariantId },
                select: { price: true }
            })
            return {
                ...item,
                pricePerItem: productVariant ? productVariant.price : 0
            }
        }))

        const order = await prisma.order.create({
            data: {
                code: generateRandomStringWithoutSymbols(12),
                customerId: existingUser.id,
                subTotal,
                taxId,
                total,
                address1: customer.address1,
                address2: customer.address2,
                postalCode: customer.postalCode,
                city: customer.city,
                state: customer.state,
                country: customer.country,
                notes: customer.notes,
                orderItems: {
                    create: orderItemsData
                }
            }
        })

        switch (paymentMethod) {
            case "flutterwave":
                const ravePaymentProvider = new FlutterwavePaymentProvider()
                const rave = new PaymentService(ravePaymentProvider)
                const flwResult = await rave.initiatePayment(customer.email, order.id, total)
                res.json(flwResult.data)
                break

            case "squad":
                const squadPaymentProvider = new SquadPaymentProvider()
                const squad = new PaymentService(squadPaymentProvider)
                const squadResult = await squad.initiatePayment(customer.email, order.id, total)
                res.json(squadResult.data)
                break

            default:
                break
        }

    } catch (error) {
        logger.error(error)
        res.status(500).json({
            success: false,
            message: 'An error occurred!',
        })
    }
}

const calculateSubTotal = async (orderItems: CheckoutItem[]) => {
    let subTotal = 0

    for (const item of orderItems) {
        const productVariant = await prisma.productVariant.findUnique({
            where: {
                id: item.productVariantId
            },
            select: {
                price: true
            }
        })

        if (productVariant) {
            subTotal += productVariant.price * item.quantity
        }
    }

    return subTotal
}

const calculateTotal = async (subTotal: number, taxId: number) => {
    const taxAmount = await prisma.tax.findUnique({
        where: {
            id: taxId
        },
        select: {
            value: true,
            type: true
        }
    })

    if (!taxAmount) {
        throw new Error('Tax record does not exist')
    }

    if (taxAmount.type === "Percentage") {
        return subTotal + (subTotal * parseFloat(taxAmount.value as unknown as string) / 100)
    }

    return subTotal + parseFloat(taxAmount.value as unknown as string)
}