import { Request, Response } from "express"
import { prisma } from "@/prisma-client"
import { logger } from "@/lib/logger"

const getCurrencies = async (req: Request, res: Response) => {
    try {
        res.json({
            success: true,
            currencies: await prisma.currency.findMany()
        })
    } catch (error) {
        logger.error(error)
    }
}

export {
    getCurrencies
}