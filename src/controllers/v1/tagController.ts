import { prisma } from '@/prisma-client'
import { logger } from '@/lib/logger'
import { Request, Response } from 'express'
import { slugifyStr } from '@/lib/helpers'

const getTags = async (req: Request, res: Response) => {
    try {
        const tags = await prisma.tag.findMany()

        return res.json({
            success: true,
            tags
        })

    } catch (error) {
        logger.error('Error fetching tags:', error)
        res.status(500).json({
            success: false,
            message: 'An error occurred!'
        })
    }
}

const createTags = async (req: Request, res: Response) => {
    try {
        const tags = await prisma.tag.createMany({
            data: [...req.body.tags.map((tag: string) => ({
                name: tag,
                slug: slugifyStr(tag)
            }))]
        })

        return res.json({
            success: true,
            message: `${tags.count} tags added`,
        })

    } catch (error) {
        logger.error('Error creating tags:', error)
        res.status(500).json({
            success: false,
            message: 'An error occurred!'
        })
    }
}

export {
    getTags,
    createTags,
}
