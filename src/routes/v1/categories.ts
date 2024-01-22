import express from 'express'
import { getCategories } from '@/controllers/v1/categoryController'

const router = express.Router()

router.get('/', getCategories)

export default router