import express from "express"
import { body } from "express-validator"
import { prisma } from '@/prisma-client'
import { createTax, getTaxes } from "@/controllers/v1/taxController"
import { validateInput } from "@/middleware/validate"

const router = express.Router()

router.get(
    '/',
    getTaxes
)

router.post(
    '/',
    [
        body('name').isString().trim().custom(async (value) => {
            const taxExists = await prisma.tax.findFirst({
                where: { name: value }
            })
            if (taxExists) {
                throw new Error('Tax already exists')
            }
            return true
        }),
        body('value').isDecimal(),
        body('type').isIn(['Percentage', 'FixedAmount']).withMessage("Type must be Percentage or FixedAmount"),
        body('isActive').isBoolean(),
        validateInput,
    ],
    createTax
)

export default router