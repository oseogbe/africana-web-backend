import { Request, Response } from "express"
import { prisma } from "@/prisma-client"
import { logger } from "@/lib/logger"

const getTaxes = async (req: Request, res: Response) => {
    try {
        res.json({
            success: true,
            taxes: await prisma.tax.findMany()
        })
    } catch (error) {
        logger.error(error)
    }
}

const createTax = async (req: Request, res: Response) => {
    const { name, value, type, isActive } = req.body

    try {
        const tax = await prisma.tax.create({
            data: {
                name,
                value: parseFloat(value as string),
                type,
                isActive
            }
        })

        res.json({
            success: true,
            tax
        })
    } catch (error) {
        logger.error(error)
    }
}

export {
    getTaxes,
    createTax
}