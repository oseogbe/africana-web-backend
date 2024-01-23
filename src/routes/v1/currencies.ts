import express from 'express'
import { getCurrencies } from '@/controllers/v1/currencyController'

const router = express.Router()

router.get('/', getCurrencies)

export default router