import { Request, Response } from "express"
import axios from "axios"
import { prisma } from "@/prisma-client"
import { generateRandomStringWithoutSymbols } from "@/lib/helpers"
import { logger } from "@/lib/logger"

interface OrderItem {
    productVariantId: string;
    quantity: number;
}

export const checkout = async (req: Request, res: Response) => {
    try {
        const { customer, orderItems, paymentMethod, taxId } = req.body
        const totalAmount = await calculateTotalAmount(orderItems, taxId)

        let result = null

        switch (paymentMethod) {
            case "flutterwave":
                result = await initializeRavePayment(
                    customer.email,
                    totalAmount,
                    `${req.protocol}://${req.hostname}`
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

const initializeRavePayment = async (email: string, amount: number, redirect_url: string): Promise<any> => {
    const headers = {
        Authorization: `Bearer ${process.env.RAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
    }

    const requestBody = {
        tx_ref: generateRandomStringWithoutSymbols(16),
        amount,
        currency: 'NGN',
        redirect_url,
        payment_options: 'card',
        customer: {
            email,
            // Add more customer details if required
        },
        customizations: {
            title: 'Africana Couture',
            description: 'Payment of order items from Africana e-commerce',
            // You can customize other parameters like logo, theme color, etc.
        },
    }

    const response = await axios.post('https://api.flutterwave.com/v3/payments', requestBody, { headers })
    return response.data
}