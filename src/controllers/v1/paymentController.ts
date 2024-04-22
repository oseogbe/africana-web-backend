import { Request, Response } from "express"
import FlutterwavePaymentProvider from "@/providers/FlutterwaveProvider"
import SquadPaymentProvider from "@/providers/SquadProvider"
import PaymentService from "@/services/PaymentService"

const verifyFlwTransaction = async (req: Request, res: Response) => {
    const ravePaymentProvider = new FlutterwavePaymentProvider()
    const rave = new PaymentService(ravePaymentProvider)
    try {
        const result = await rave.verifyTransaction(req.query.tx_ref as string)
        return res.json({
            success: true,
            message: result
        })
    } catch (error: any) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}

const verifySquadTransaction = async (req: Request, res: Response) => {
    const squadPaymentProvider = new SquadPaymentProvider()
    const squad = new PaymentService(squadPaymentProvider)
    try {
        const result = await squad.verifyTransaction(req.query.transaction_ref as string)
        return res.json({
            success: true,
            message: result
        })
    } catch (error: any) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}

export {
    verifyFlwTransaction,
    verifySquadTransaction
}