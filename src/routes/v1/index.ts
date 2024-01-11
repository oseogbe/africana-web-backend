import express from 'express'
import auth from '@/routes/v1/auth'

const router = express.Router()

router.use('/auth', auth)

export default router