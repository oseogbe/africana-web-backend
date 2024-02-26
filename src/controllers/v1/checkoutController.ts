import { Request, Response } from "express"
import axios from "axios"
import { Customer, Order } from "@prisma/client"
import { prisma } from "@/prisma-client"
import { generateRandomStringWithoutSymbols } from "@/lib/helpers"
import { logger } from "@/lib/logger"

export type CheckoutItem = {
    productVariantId: string;
    quantity: number;
}

type CustomerDetails = Pick<Customer, "firstName" | "lastName" | "email" | "phone">

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
            });
            return {
                ...item,
                pricePerItem: productVariant ? productVariant.price : 0
            };
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

        let result = null

        switch (paymentMethod) {
            case "flutterwave":
                result = await initializeRavePayment(
                    customer,
                    order,
                    total,
                )
                break

            default:
                break
        }

        return res.json(result)

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

const initializeRavePayment = async (customer: CustomerDetails, order: Order, amount: number): Promise<any> => {
    const headers = {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
    }

    const tx_ref = generateRandomStringWithoutSymbols(12)

    const requestBody = {
        tx_ref,
        amount,
        currency: 'NGN',
        redirect_url: process.env.FLW_PAYMENT_CALLBACK_URL,
        payment_options: 'card',
        customer: {
            name: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
            phone: customer?.phone,
        },
        meta: {},
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
            orderId: order.id,
            channel: "Flutterwave",
            reference: tx_ref,
            amount,
            currencyId: currency.id,
            meta: {},
        }
    })

    const response = await axios.post('https://api.flutterwave.com/v3/payments', requestBody, { headers })
    return response.data
}