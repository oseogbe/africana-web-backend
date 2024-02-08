import { PrismaClient } from '@prisma/client'
import { randomSelect, setAmount, slugify } from '../src/lib/helpers'
import { faker } from '@faker-js/faker'

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

async function seedProducts(length: number) {
    Array.from({ length }, async () => {
        const productName = faker.commerce.productName()

        const productVariants = Array.from({ length: 3 }, () => ({
            sku: faker.string.alphanumeric({ length: { min: 8, max: 12 } }),
            size: randomSelect(['S', 'M', 'L', 'XL', 'XXL', 'XXXL']),
            price: setAmount(parseInt(faker.commerce.price({ min: 100000, max: 200000 }))),
            oldPrice: setAmount(parseInt(faker.commerce.price({ min: 100000, max: 200000 }))),
            quantity: faker.number.int({ min: 5, max: 10 })
        }))

        const productImages = [
            {
                url: `${faker.string.alphanumeric({ length: { min: 20, max: 30 } })}.jpg`,
                isDefault: true
            },
            {
                url: `${faker.string.alphanumeric({ length: { min: 20, max: 30 } })}.jpg`,
                isDefault: false
            },
            {
                url: `${faker.string.alphanumeric({ length: { min: 20, max: 30 } })}.jpg`,
                isDefault: false
            },
        ]

        const product = await prisma.product.create({
            data: {
                name: productName,
                slug: slugify(productName),
                description: faker.commerce.productDescription(),
                currencyId: 1,
                lowOnStockMargin: 2,
                productVariants: {
                    create: [
                        ...productVariants.map(variant => ({
                            ...variant,
                            price: setAmount(variant.price),
                            oldPrice: variant.oldPrice ? setAmount(variant.oldPrice) : null,
                        }))
                    ],
                },
                productImages: {
                    create: [
                        ...productImages
                    ],
                },
            }
        })

        const categoryResult: number[] = await prisma.$queryRaw`SELECT id FROM Category ORDER BY RAND() LIMIT 3;`
        const categoryIds = categoryResult.map((row: any) => row.id).sort((a, b) => a - b)

        const tagResult: number[] = await prisma.$queryRaw`SELECT id FROM Tag ORDER BY RAND() LIMIT 5;`
        const tagIds = tagResult.map((row: any) => row.id).sort((a, b) => a - b)

        const productCategoriesAndTags = await prisma.product.update({
            where: { id: product.id },
            data: {
                categories: {
                    connect: [
                        ...categoryIds.map(category => ({
                            id: category,
                        }))
                    ],
                },
                tags: {
                    connect: [
                        ...tagIds.map(tag => ({
                            id: tag,
                        }))
                    ],
                }
            }
        })

    })

    console.log('Test products seeded successfully')
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
    // await seedCurrencies(currenciesData)
    // await prisma.category.deleteMany({})
    // await seedCategories(categoriesData)
    // await seedProducts(20)
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