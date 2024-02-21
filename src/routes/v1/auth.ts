import express from 'express'
import { login, loginAdmin, register, logout, refreshToken, confirmEmail, changePassword } from '@/controllers/v1/authController'
import { authenticateToken } from '@/middleware/authenticate'
import { body } from 'express-validator'
import { validateInput } from '@/middleware/validate'
import { generateRandomString } from '@/lib/helpers'

const router = express.Router()

router.get('/initialize', (req, res) => {
    const sessionId = generateRandomString(16)
    res.cookie(
        'africana_session_id',
        sessionId,
        {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            secure: true,
            sameSite: 'none'
        }
    )
    res.send('Session initialized')
})

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
    '/admin/login',
    [
        body('email').isString().trim().isEmail().withMessage('Email is required'),
        body('password').isString().notEmpty().withMessage('Password is required'),
    ],
    validateInput,
    loginAdmin
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