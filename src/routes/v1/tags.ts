import express from 'express'
import { body } from 'express-validator'
import { getTags, createTags } from '@/controllers/v1/tagController'
import { authenticateToken, isAdmin } from '@/middleware/authenticate'
import { prisma } from '@/prisma-client'
import { validateInput } from '@/middleware/validate'

const router = express.Router()

router.get('/', getTags)
router.post(
    '/create',
    authenticateToken,
    isAdmin,
    [
        body('tags.*').custom(async (value: string) => {
            const existingTag = await prisma.tag.findFirst({
                where: { name: value }
            })

            if (existingTag) {
                throw new Error(`Tag '${value}' already exists.`);
            }

            return true
        }),
        validateInput
    ],
    createTags
)

export default router