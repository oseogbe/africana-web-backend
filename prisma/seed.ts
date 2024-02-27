import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import * as fs from 'fs'
import csvParser from 'csv-parser'
import bcrypt from 'bcrypt'
import slugify from '@sindresorhus/slugify'
import { generateRandomStringWithoutSymbols, randomSelect } from '../src/lib/helpers'

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

interface ProductVariant {
    sku: string;
    size: string;
    color: string;
    price: number;
    oldPrice: number | null;
    quantity: number;
}

interface ProductImage {
    url: string;
    isDefault: boolean;
}

interface ProductFromFile {
    name: string;
    description: string;
    productVariants: ProductVariant[];
    productImages: ProductImage[];
}

async function seedAdmin() {
    const password = await bcrypt.hash("shopafricana123", 10)
    await prisma.admin.create({
        data: {
            name: "Africana Admin",
            email: "admin@shopafricana.co",
            password
        }
    })
    console.log('Admin user created')
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
            price: parseInt(faker.commerce.price({ min: 400, max: 500 })),
            oldPrice: parseInt(faker.commerce.price({ min: 500, max: 600 })),
            quantity: faker.number.int({ min: 1, max: 2 })
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
                    create: productVariants,
                },
                productImages: {
                    create: productImages,
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

function readCSV(filePath: string) {
    return new Promise((resolve, reject) => {
        const products: ProductFromFile[] = []

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', async (row) => {
                const name = row.name
                const description = row.description
                const price = row['productVariants:price'] as string
                const productVariants = [
                    {
                        sku: faker.string.alphanumeric({ length: { min: 8, max: 12 } }),
                        size: row['productVariants:size'],
                        color: row['productVariants:color'],
                        price: parseInt(price.slice(1), 10),
                        oldPrice: null,
                        quantity: 1,
                    }
                ]
                const productImages = [
                    {
                        url: row['productImages:url'] || `https://shopafricana.co/wp-content/uploads/2024/01/${generateRandomStringWithoutSymbols(12).toLowerCase()}.jpg`,
                        isDefault: true
                    },
                ]
                products.push({ name, description, productVariants, productImages });
            }).on('end', () => {
                resolve(products)
            })
            .on('error', (error) => {
                reject(error)
            })
    })
}

async function seedProductsFromJsonFile() {
    const productsData = await readCSV(`${__dirname}/products.csv`) as ProductFromFile[]

    for (const productData of productsData) {
        const { name, description, productVariants, productImages } = productData

        const product = await prisma.product.create({
            data: {
                name,
                slug: slugify(name),
                description,
                currencyId: 1,
                lowOnStockMargin: 2,
                productVariants: {
                    create: productVariants,
                },
                productImages: {
                    create: productImages,
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
    }

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
    await prisma.payment.deleteMany({})
    await prisma.orderItem.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.productVariant.deleteMany({})
    await prisma.productImage.deleteMany({})
    await prisma.productReview.deleteMany({})
    await prisma.product.deleteMany({})
    // await seedProducts(20)
    await seedProductsFromJsonFile()
    // await seedAdmin()
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