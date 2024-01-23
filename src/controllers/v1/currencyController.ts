import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import { logger } from "@/lib/logger"

const prisma = new PrismaClient()

const getCurrencies = async (req: Request, res: Response) => {
    try {
        res.json({
            success: true,
            currencies: await prisma.currency.findMany()
        })
    } catch (error) {
        logger.error(error)
    } finally {
        await prisma.$disconnect()
    }
}

export {
    getCurrencies
}