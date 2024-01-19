import express, { NextFunction, Request, Response } from 'express'
import { login, register, logout, refreshToken, confirmEmail, changePassword } from '@/controllers/v1/authController'
import { authenticateToken } from '@/middleware/authenticate'
import { body, validationResult } from 'express-validator'

const router = express.Router()

// Middleware for handling validation errors
const validateInput = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    next()
}

router.post('/login', login)

router.post('/register', register)

router.post('/confirm-email', confirmEmail)

router.post(
    '/change-password',
    authenticateToken,
    [
        body('oldPassword').isString().notEmpty().withMessage('Old password is required'),
        body('newPassword').isString().notEmpty().withMessage('New password is required'),
        body('confirmNewPassword')
            .custom((value, { req }) => {
                if (value !== req.body.newPassword) {
                    throw new Error('Passwords do not match');
                }
                return true;
            })
            .isString().notEmpty().withMessage('Confirm new password is required'),
    ],
    validateInput,
    changePassword
)

router.get('/refresh', refreshToken)

router.get('/logout', logout)

export default router