import { Request, Response } from "express"
import axios from "axios"
import { Customer } from "@prisma/client"
import { prisma } from "@/prisma-client"
import { generateRandomStringWithoutSymbols } from "@/lib/helpers"
import { logger } from "@/lib/logger"

interface OrderItem {
    productVariantId: string;
    quantity: number;
}

type CustomerDetails = Pick<Customer, "firstName" | "lastName" | "email" | "phone">

export const checkout = async (req: Request, res: Response) => {
    try {
        const { customer, orderItems, paymentMethod, taxId } = req.body
        const totalAmount = await calculateTotalAmount(orderItems, taxId)

        let result = null

        const baseUrl = `${req.protocol}://${req.get('host')}`

        switch (paymentMethod) {
            case "flutterwave":
                result = await initializeRavePayment(
                    customer,
                    totalAmount,
                    baseUrl
                )
                break;

            default:
                break;
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

const calculateTotalAmount = async (orderItems: OrderItem[], taxId: number) => {
    let total = 0

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
            total += productVariant.price * item.quantity
        } else {
            throw new Error(`Product variant with id ${item.productVariantId} not found`);
        }
    }

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
        return total + (total * parseFloat(taxAmount.value as unknown as string) / 100)
    }

    return total + parseFloat(taxAmount.value as unknown as string)
}

const initializeRavePayment = async (customer: CustomerDetails, amount: number, baseUrl: string): Promise<any> => {
    const headers = {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
    }

    const tx_ref = generateRandomStringWithoutSymbols(16)

    const requestBody = {
        tx_ref,
        amount,
        currency: 'NGN',
        redirect_url: `${baseUrl}/api/v1/flutterwave/payment-callback`,
        payment_options: 'card',
        customer: {
            name: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
            phone: customer?.phone,
        },
        meta: {

        },
        customizations: {
            title: 'Africana Couture',
            description: 'Payment of order items from Africana e-commerce',
            logo: `${baseUrl}/img/africana-logo.png`
        },
    }

    await prisma.payment.create({
        data: {
            channel: "Flutterwave",
            reference: tx_ref,
            amount,
            meta: {
                email: customer.email
            }
        }
    })

    const response = await axios.post('https://api.flutterwave.com/v3/payments', requestBody, { headers })
    return response.data
}