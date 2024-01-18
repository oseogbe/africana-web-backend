import { Request, Response } from 'express'
import { PrismaClient, Prisma } from '@prisma/client'
import { z } from 'zod'
import jwt, { Secret } from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { generateRandomPassword } from '@/lib/helpers'

const prisma = new PrismaClient()

const customErrorMap: z.ZodErrorMap = (error, ctx) => {
    switch (error.code) {
        case z.ZodIssueCode.too_small:
            const path = error.path[0].toString()
            const field = path.charAt(0).toUpperCase() + path.split(/(?=[A-Z])/).join(' ').slice(1).toLowerCase()
            return {
                message: `${field} must contain at least ${error.minimum} characters`,
            };
        default:
            // fall back to default message!
            return { message: ctx.defaultError };
    }
}

const login = async (req: Request, res: Response) => {
    try {
        const validator = z.object({
            email: z.string().email(),
            password: z.string().refine(data => data.trim() !== '', {
                message: 'Password is required',
            }),
        })

        const { email, password } = validator.required().parse({ ...req.body })

        const customer = await prisma.customer.findUnique({ where: { email } })

        if (customer) {
            const match = await bcrypt.compare(password, customer.password)
            if (match) {
                const accessTokenSecret: Secret | undefined = process.env.ACCESS_TOKEN_SECRET
                const refreshTokenSecret: Secret | undefined = process.env.REFRESH_TOKEN_SECRET

                if (!accessTokenSecret || !refreshTokenSecret) {
                    throw new Error('Access token or Refresh token secret is not defined')
                }

                const accessToken = jwt.sign({ "email": customer.email }, accessTokenSecret, { expiresIn: '5m' })
                const refreshToken = jwt.sign({ "email": customer.email }, refreshTokenSecret, { expiresIn: '1d' })

                await prisma.customer.update({
                    where: { email },
                    data: { refreshToken }
                })

                return res.json({
                    success: true,
                    message: "Login successful",
                    accessToken,
                }).cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
            } else {
                return res.status(401).json({
                    success: false,
                    message: "Check the email address and password and try again",
                })
            }
        } else {
            return res.status(401).json({
                success: false,
                message: "Check the email address and password and try again",
            })
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Zod validation error
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(error => ({
                    message: error.message,
                    path: error.path
                })),
            })
        } else {
            // Other errors
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
            })
        }
    }
}

const register = async (req: Request, res: Response) => {
    try {
        const validator = z.object({
            firstName: z.string().min(2),
            lastName: z.string().min(2),
            email: z.string().email(),
        })

        const { firstName, lastName, email } = validator.parse({ ...req.body }, { errorMap: customErrorMap })

        const existingUser = await prisma.customer.findUnique({
            where: { email },
        })

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists',
            })
        }

        const password = generateRandomPassword()
        console.log(password)
        const hashedPassword = await bcrypt.hash(password, 10)
        const customer = await prisma.customer.create({
            data: { firstName, lastName, email, password: hashedPassword },
        })

        const accessTokenSecret: Secret | undefined = process.env.ACCESS_TOKEN_SECRET
        const refreshTokenSecret: Secret | undefined = process.env.REFRESH_TOKEN_SECRET

        if (!accessTokenSecret || !refreshTokenSecret) {
            throw new Error('Access token or Refresh token secret is not defined')
        }

        const accessToken = jwt.sign({ "email": customer.email }, accessTokenSecret, { expiresIn: '30m' })
        const refreshToken = jwt.sign({ "email": customer.email }, refreshTokenSecret, { expiresIn: '1d' })

        await prisma.customer.update({
            where: { email },
            data: { refreshToken }
        })

        return res.json({
            success: true,
            message: "Registration successful",
            accessToken,
        }).cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Zod validation error
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(error => ({
                    message: error.message,
                    path: error.path
                })),
            })
        } else {
            // Other errors
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
            })
        }
    }

}

const logout = async (req: Request, res: Response) => {

}

export {
    login,
    register,
    logout
}