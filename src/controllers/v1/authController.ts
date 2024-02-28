import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '@/prisma-client'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { generateRandomString } from '@/lib/helpers'
import { logger } from '@/lib/logger'
import { sendConfirmationEmail, sendLoginDetailsEmail } from '@/lib/mailer'

const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        const customer = await prisma.customer.findUnique({ where: { email } })

        if (customer && customer.password) {
            const match = await bcrypt.compare(password, customer.password)
            if (match) {
                const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
                const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET

                if (!accessTokenSecret || !refreshTokenSecret) {
                    throw new Error('Access token or Refresh token secret is not defined')
                }

                const accessToken = jwt.sign({ "email": customer.email }, accessTokenSecret, { expiresIn: '30m' })
                const refreshToken = jwt.sign({ "email": customer.email }, refreshTokenSecret, { expiresIn: '1d' })

                await prisma.customer.update({
                    where: { email },
                    data: { refreshToken }
                })

                res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: true, sameSite: 'none' })
                // res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
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
        logger.error(error)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
}

const loginAdmin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        const admin = await prisma.admin.findUnique({ where: { email } })

        if (admin && admin.password) {
            const match = await bcrypt.compare(password, admin.password)
            if (match) {
                const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
                const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET

                if (!accessTokenSecret || !refreshTokenSecret) {
                    throw new Error('Access token or Refresh token secret is not defined')
                }

                const accessToken = jwt.sign({ "email": admin.email }, accessTokenSecret, { expiresIn: '30m' })
                const refreshToken = jwt.sign({ "email": admin.email }, refreshTokenSecret, { expiresIn: '1d' })

                await prisma.admin.update({
                    where: { email },
                    data: { refreshToken }
                })

                res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: true, sameSite: 'none' })

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
        logger.error(error)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
}

const register = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email } = req.body

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
        sendConfirmationEmail(customer.email, `${process.env.FRONTEND_URL}/confirm-email`)

        res.json({
            success: true,
            message: 'Confirmation email sent',
            customer
        })
    } catch (error) {
        logger.error(error)
        res.status(500).json({
            success: false,
            message: 'Error sending confirmation email',
        })
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

        const password = generateRandomString(8)
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.customer.update({
            where: { email: customer.email },
            data: {
                emailVerifiedAt,
                password: hashedPassword,
                refreshToken
            }
        })

        sendLoginDetailsEmail(customer.email, password, `${process.env.FRONTEND_URL}/login`)

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
    }
}

export {
    login,
    loginAdmin,
    register,
    confirmEmail,
    changePassword,
    refreshToken,
    logout
}