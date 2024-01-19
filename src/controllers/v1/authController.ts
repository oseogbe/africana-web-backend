import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { generateRandomPassword } from '@/lib/helpers'
import { logger } from '@/lib/logger'
import { sendConfirmationEmail, sendLoginDetailsEmail } from '@/lib/mailer'

const prisma = new PrismaClient()

const customErrorMap: z.ZodErrorMap = (error, ctx) => {
    switch (error.code) {
        case z.ZodIssueCode.too_small:
            const path = error.path[0].toString()
            const field = path.charAt(0).toUpperCase() + path.split(/(?=[A-Z])/).join(' ').slice(1).toLowerCase()
            return {
                message: `${field} must contain at least ${error.minimum} characters`,
            }
        default:
            // fall back to default message!
            return { message: ctx.defaultError }
    }
}

const login = async (req: Request, res: Response) => {
    const validator = z.object({
        email: z.string().email(),
        password: z.string().refine(data => data.trim() !== '', {
            message: 'Password is required',
        }),
    })

    try {
        const { email, password } = validator.required().parse({ ...req.body })

        const customer = await prisma.customer.findUnique({ where: { email } })

        if (customer && customer.password) {
            const match = await bcrypt.compare(password, customer.password)
            if (match) {
                const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
                const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET

                if (!accessTokenSecret || !refreshTokenSecret) {
                    throw new Error('Access token or Refresh token secret is not defined')
                }

                const accessToken = jwt.sign({ "email": customer.email }, accessTokenSecret, { expiresIn: '5m' })
                const refreshToken = jwt.sign({ "email": customer.email }, refreshTokenSecret, { expiresIn: '1d' })

                await prisma.customer.update({
                    where: { email },
                    data: { refreshToken }
                })

                // res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: true, sameSite: 'none' })
                res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
                res.json({
                    success: true,
                    message: "Login successful",
                    accessToken,
                })
            } else {
                res.status(401).json({
                    success: false,
                    message: "Check the email address and password and try again",
                })
            }
        } else {
            res.status(401).json({
                success: false,
                message: "Check the email address and password and try again",
            })
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(error => ({
                    message: error.message,
                    path: error.path
                })),
            })
        } else {
            logger.error(error)
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            })
        }
    } finally {
        await prisma.$disconnect()
    }
}

const register = async (req: Request, res: Response) => {
    const validator = z.object({
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        email: z.string().email(),
    })

    try {
        const { firstName, lastName, email } = validator.parse({ ...req.body }, { errorMap: customErrorMap })

        const existingUser = await prisma.customer.findUnique({
            where: { email },
        })

        if (existingUser) {
            // 409 - conflict
            return res.status(409).json({
                success: false,
                message: 'User already exists',
            })
        }

        const customer = await prisma.customer.create({
            data: { firstName, lastName, email },
        })

        // client url to confirm email will make a post request to backend
        sendConfirmationEmail(customer.email, 'https://shop.africana.co/confirm-email')

        res.json({
            success: true,
            message: 'Confirmation email sent'
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(error => ({
                    message: error.message,
                    path: error.path
                })),
            })
        } else {
            logger.error(error)
            res.status(500).json({
                success: false,
                message: 'Error sending confirmation email',
            })
        }
    } finally {
        await prisma.$disconnect()
    }
}

const confirmEmail = async (req: Request, res: Response) => {
    try {
        const customer = await prisma.customer.findUnique({
            where: { email: req.body.email },
            select: { email: true, emailVerifiedAt: true }
        })

        if (!customer) return res.sendStatus(404)

        if (customer.emailVerifiedAt) return res.json("Email already verified")

        const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET

        if (!refreshTokenSecret) {
            throw new Error('Refresh token secret is not defined')
        }

        const refreshToken = jwt.sign({ "email": customer.email }, refreshTokenSecret, { expiresIn: '1d' })

        const emailVerifiedAt = new Date().toISOString()

        const password = generateRandomPassword()
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.customer.update({
            where: { email: customer.email },
            data: {
                emailVerifiedAt,
                password: hashedPassword,
                refreshToken
            }
        })

        sendLoginDetailsEmail(customer.email, password, 'https://shop.africana.co/login')

        res.json({
            success: true,
            message: 'Login details email sent'
        })
    } catch (error) {
        logger.error(error)
        res.status(500).json({
            success: false,
            message: 'Error sending login details email',
        })
    } finally {
        await prisma.$disconnect()
    }
}

const changePassword = async (req: Request, res: Response) => {
    try {
        const { oldPassword, newPassword } = req.body

        const customer = await prisma.customer.findUnique({ where: { email: req.user }, select: { password: true } })

        const match = await bcrypt.compare(oldPassword, customer?.password ?? '')
        if (match) {
            await prisma.customer.update({
                where: { email: req.user },
                data: { password: await bcrypt.hash(newPassword, 10) }
            })

            return res.json({
                success: true,
                message: "Password updated"
            })
        }

        res.json({
            error: "Current password is incorrect"
        })
    } catch (error) {
        logger.error(error)
    } finally {
        prisma.$disconnect()
    }
}

const refreshToken = async (req: Request, res: Response) => {

    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(401)

    try {
        const refreshToken: string = cookies.jwt
        const customer = await prisma.customer.findFirst({
            where: { refreshToken }
        })
        if (!customer) return res.sendStatus(403)

        const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
        const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET

        if (!accessTokenSecret || !refreshTokenSecret) {
            throw new Error('Access token or Refresh token secret is not defined')
        }

        jwt.verify(refreshToken, refreshTokenSecret, (err, decoded) => {
            const jwtPayload = decoded as JwtPayload
            if (err || customer.email !== jwtPayload?.email) return res.sendStatus(403)
            const accessToken = jwt.sign({ "email": jwtPayload.email }, accessTokenSecret, { expiresIn: '30m' })
            res.json({ accessToken })
        })
    } catch (error) {
        logger.error(error)
    } finally {
        await prisma.$disconnect()
    }
}

const logout = async (req: Request, res: Response) => {

    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(204)   // no content

    try {
        const refreshToken: string = cookies.jwt
        const customer = await prisma.customer.findFirst({
            where: { refreshToken }
        })

        const cookieOptions = {
            httpOnly: true,
            secure: true,
        }

        if (!customer) {
            res.clearCookie('jwt', cookieOptions)
            return res.sendStatus(204)
        }

        await prisma.customer.update({
            where: { id: customer.id },
            data: {
                refreshToken: ''
            }
        })
        res.clearCookie('jwt', cookieOptions)
        return res.sendStatus(204)
    } catch (error) {
        logger.error(error)
    } finally {
        await prisma.$disconnect()
    }
}

export {
    login,
    register,
    confirmEmail,
    changePassword,
    refreshToken,
    logout
}