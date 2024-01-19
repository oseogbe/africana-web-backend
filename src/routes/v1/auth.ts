import express from 'express'
import { login, register, logout, refreshToken, confirmEmail } from '@/controllers/v1/authController'

const router = express.Router()

router.post('/login', login)
router.post('/register', register)
router.post('/confirm-email', confirmEmail)
router.get('/refresh', refreshToken)
router.get('/logout', logout)

export default router