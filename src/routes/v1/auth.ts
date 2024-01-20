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

router.post(
    '/login',
    [
        body('email').isString().trim().isEmail().withMessage('Email is required'),
        body('password').isString().notEmpty().withMessage('Password is required'),
    ],
    validateInput,
    login
)

router.post(
    '/register',
    [
        body('firstName').isString().trim().isLength({ min: 2 }).withMessage('First name is required'),
        body('lastName').isString().trim().isLength({ min: 2 }).withMessage('Last name is required'),
        body('email').isString().trim().isEmail().withMessage('Email is required'),
    ],
    validateInput,
    register
)

router.post('/confirm-email', confirmEmail)

router.post(
    '/change-password',
    authenticateToken,
    [
        body('oldPassword').isString().trim().notEmpty().withMessage('Old password is required'),
        body('newPassword').isString().trim().notEmpty().withMessage('New password is required'),
        body('confirmNewPassword')
            .custom((value, { req }) => {
                if (value !== req.body.newPassword) {
                    throw new Error('Passwords do not match');
                }
                return true;
            })
            .isString().trim().notEmpty().withMessage('Confirm new password is required'),
    ],
    validateInput,
    changePassword
)

router.get('/refresh', refreshToken)

router.get('/logout', logout)

export default router