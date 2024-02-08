import { PrismaClient } from '@prisma/client'
import { slugify } from "../src/lib/helpers";

const prisma = new PrismaClient()

interface CurrencyInterface {
    code: string;
    name: string;
    exchangeRate: number;
    isDefault: boolean;
    isActive: boolean;
}

interface CategoryInterface {
    name: string;
    children?: any[];
}

async function seedCurrencies(currenciesData: CurrencyInterface[]) {
    for (const currency of currenciesData) {
        await prisma.currency.create({
            data: { ...currency },
        })
    }
    console.log('Currencies seeded successfully')
}

async function seedCategories(categoriesData: CategoryInterface[], parentId?: number, parentSlug?: string) {
    for (const categoryData of categoriesData) {
        const { name, children } = categoryData
        const slug = slugify(name)

        const category = await prisma.category.create({
            data: {
                name,
                parentId,
                slug: parentSlug?.length ? parentSlug + '-' + slug : slug,
            },
        })

        if (children && children.length > 0) {
            await seedCategories(children, category.id, category.slug)
        }
    }
    console.log('Category seeded successfully')
}

const currenciesData = [
    {
        code: 'NGN',
        name: 'Naira',
        exchangeRate: 1,
        isDefault: true,
        isActive: true,
    }
]

const categoriesData = [
    {
        name: 'Men',
        children: [
            {
                name: 'Clothing',
                children: [
                    { name: 'New In' },
                    { name: 'Kaftan' },
                    { name: 'Dashiki' },
                    { name: 'T-Shirt' },
                    { name: 'Dress Shirt' },
                    { name: 'Underwear' },
                ],
            },
            {
                name: 'Shoes',
                children: [
                    { name: 'Sneakers' },
                    { name: 'Mules' },
                    { name: 'Slides' },
                    { name: 'Slippers' },
                ],
            },
            {
                name: 'Accessories',
                children: [
                    { name: 'Scarf' },
                    { name: 'Wallets' },
                    { name: 'Bags' },
                    { name: 'Purses' },
                ],
            },
        ],
    },
    {
        name: 'Women',
        children: [
            {
                name: 'Clothing',
                children: [
                    { name: 'New In' },
                    { name: 'Dashiki' },
                    { name: 'T-Shirt' },
                    { name: 'Underwear' },
                ],
            },
            {
                name: 'Shoes',
                children: [
                    { name: 'Sneakers' },
                    { name: 'Mules' },
                    { name: 'Slides' },
                    { name: 'Slippers' },
                ],
            },
            {
                name: 'Accessories',
                children: [
                    { name: 'Scarf' },
                    { name: 'Wallets' },
                    { name: 'Bags' },
                    { name: 'Purses' },
                ],
            },
        ],
    },
    {
        name: 'Gifts',
        children: [],
    },
    {
        name: 'Sales',
        children: [],
    }
]

async function main() {
    // await prisma.currency.deleteMany({})
    await seedCurrencies(currenciesData)
    // await prisma.category.deleteMany({})
    await seedCategories(categoriesData)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })