import { PrismaClient } from "@prisma/client"

export async function seedCategories(prisma: PrismaClient, categoriesData: { name: string; children?: any[] }[], parentId?: number, parentSlug?: string) {
    for (const categoryData of categoriesData) {
        const { name, children } = categoryData
        const slug = name.toLowerCase().replace(/\s+/g, '-')

        const category = await prisma.category.create({
            data: {
                name,
                parentId,
                slug: parentSlug?.length ? parentSlug + '-' + slug : slug,
            },
        })

        if (children && children.length > 0) {
            await seedCategories(prisma, children, category.id, category.slug)
        }
    }

    console.log('Category seeded successfully')
}
