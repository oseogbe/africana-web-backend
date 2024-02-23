import { Request, Response } from "express"
import { prisma } from "@/prisma-client"
import { logger } from "@/lib/logger"

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

            const response = await flw.VerifyTransaction.verify({ id: req.query.transaction_id })

            if (
                response.data.status === "successful"
                && response.data.amount === payment?.amount
                && response.data.currency === "NGN") {
                // create order
                logger.log(response.data)
                res.json({
                    success: true
                })

                // Find payment, with reference=tx_ref, update status "successful"
                // get customer id from orders and update payment
                // return successful
            } else {
                // update status "failed"
                logger.log(response.data)
                res.json({
                    success: false
                })
            }

        } catch (error) {
            logger.error(error)
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