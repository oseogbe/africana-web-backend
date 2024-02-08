import { prisma } from '@/prisma-client'
import { logger } from '@/lib/logger'
import { Request, Response } from 'express'

const getCategories = async (req: Request, res: Response) => {
    try {
        const allCategories = await prisma.category.findMany()
        const categoriesOrdered = organizeCategories(allCategories)

        return res.json({
            success: true,
            categoriesOrdered
        })

    } catch (error) {
        logger.error('Error fetching categories:', error)
        res.status(500).json({ error: 'Internal Server Error' })
    }
}

function organizeCategories(categories: any[]) {
    const categoryMap = new Map<number, any>()

    categories.forEach((category) => {
        category.children = []
        categoryMap.set(category.id, category)

        const parentId = category.parentId || null
        if (parentId !== null) {
            const parentCategory = categoryMap.get(parentId)
            if (parentCategory) {
                parentCategory.children.push(category)
            }
        }
    })

    const sanitizedCategories = categories
        .filter((category) => category.parentId === null)
        .map((category) => sanitizeCategory(category))

    return sanitizedCategories
}

function sanitizeCategory(category: any) {
    const { parentId, updatedAt, createdAt, ...rest } = category
    const sanitizedCategory = { ...rest }

    if (category.children && category.children.length > 0) {
        sanitizedCategory.children = category.children.map((childCategory: any) =>
            sanitizeCategory(childCategory)
        )
    }

    return sanitizedCategory
}

export {
    getCategories
}