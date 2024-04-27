import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import * as fs from 'fs'
import csvParser from 'csv-parser'
import bcrypt from 'bcrypt'
import { generateRandomStringWithoutSymbols, randomSelect, slugifyStr } from '../src/lib/helpers'

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
    slug: string;
    description: string;
    productVariants: ProductVariant[];
    productImages: ProductImage[];
    categories: { id: number }[];
}

function pascalCase(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1)
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
        const slug = slugifyStr(name)

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

        const price = parseFloat(faker.commerce.price({ min: 20, max: 50 }))

        const productVariants = Array.from({ length: 3 }, () => ({
            sku: faker.string.alphanumeric({ length: { min: 8, max: 12 } }),
            size: randomSelect(['S', 'M', 'L', 'XL', 'XXL', 'XXXL']),
            price,
            oldPrice: price + 5,
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

        const currency = await prisma.currency.findFirst()

        if (!currency) {
            throw new Error('Currency does not exist!')
        }

        const product = await prisma.product.create({
            data: {
                name: productName,
                slug: slugifyStr(productName),
                description: faker.commerce.productDescription(),
                currencyId: currency.id,
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

        const totalQuantity = await getProductTotalQuantity(product.id)

        await prisma.product.update({
            where: {
                id: product.id
            },
            data: {
                totalQuantity
            }
        })
    })

    console.log('Test products seeded successfully')
}

async function readCSV(filePath: string) {
    return new Promise((resolve, reject) => {
        const products: ProductFromFile[] = []

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', async (row) => {
                const name = pascalCase(row.productname)
                const slug = slugifyStr(row.productname)
                const description = row.productname
                // const price = row['productVariants:price'] as string
                const productVariants = [
                    {
                        sku: faker.string.alphanumeric({ length: { min: 8, max: 12 } }),
                        // size: row['productVariants:size'],
                        size: randomSelect(['S', 'M', 'L']),
                        // color: row['productVariants:color'],
                        color: randomSelect(['White', 'Grey', 'Black']),
                        // price: parseInt(price.slice(1), 10),
                        price: 10,
                        oldPrice: null,
                        quantity: 1,
                    }
                ]

                let categories: { id: number }[]

                switch (row.category) {
                    case 'africana pen':
                        categories = await prisma.category.findMany({ where: { name: 'Pens' }, select: { id: true } })
                        break
                    case 'bags':
                        categories = await prisma.category.findMany({ where: { name: 'Bags' }, select: { id: true } })
                        break
                    case 'face caps':
                        categories = await prisma.category.findMany({ where: { name: 'Caps' }, select: { id: true } })
                        break
                    case 'flip flops':
                        categories = await prisma.category.findMany({ where: { name: 'Slippers' }, select: { id: true } })
                        break
                    case 'kaftans':
                        categories = await prisma.category.findMany({ where: { name: 'Kaftan' }, select: { id: true } })
                        break
                    case 'lounge wears':
                        categories = await prisma.category.findMany({ where: { name: 'Loungewear' }, select: { id: true } })
                        break
                    case 'scarves':
                        categories = await prisma.category.findMany({ where: { name: 'Scarf' }, select: { id: true } })
                        break
                    case 'slides':
                        categories = await prisma.category.findMany({ where: { name: 'Slides' }, select: { id: true } })
                        break
                    case 'sweat shirts':
                        categories = await prisma.category.findMany({ where: { name: 'T-Shirt' }, select: { id: true } })
                        break
                    case 't shirts':
                        categories = await prisma.category.findMany({ where: { name: 'T-Shirt' }, select: { id: true } })
                        break
                    default:
                        categories = []
                        break
                }

                // const productImages = [
                //     {
                //         url: row['productImages:url'] || `https://shopafricana.co/wp-content/uploads/2024/01/${generateRandomStringWithoutSymbols(12).toLowerCase()}.jpg`,
                //         isDefault: true
                //     },
                // ]
                const productImages = row.url.split(",").map((url: string, index: number) => ({
                    url: url,
                    isDefault: index === 0 ? true : false
                }))

                products.push({ name, slug, description, productVariants, productImages, categories })
            })
            .on('end', () => {
                resolve(products)
            })
            .on('error', (error) => {
                reject(error)
            })
    })
}

async function seedProductsFromJsonFile() {
    const productsData = await readCSV(`${__dirname}/products-2.csv`) as ProductFromFile[]

    const currency = await prisma.currency.findFirst()

    if (!currency) {
        throw new Error('Currency does not exist!')
    }

    for (const productData of productsData) {
        const { name, slug, description, productVariants, productImages, categories } = productData

        const product = await prisma.product.create({
            data: {
                name,
                slug: `${slug}-${generateRandomStringWithoutSymbols(6)}`,
                description,
                currencyId: currency.id,
                lowOnStockMargin: 0,
                productVariants: {
                    create: productVariants,
                },
                productImages: {
                    create: productImages,
                },
            }
        })

        // const categoryResult: number[] = await prisma.$queryRaw`SELECT id FROM Category ORDER BY RAND() LIMIT 3;`
        // const categoryIds = categoryResult.map((row: any) => row.id).sort((a, b) => a - b)

        // const tagResult: number[] = await prisma.$queryRaw`SELECT id FROM Tag ORDER BY RAND() LIMIT 5;`
        // const tagIds = tagResult.map((row: any) => row.id).sort((a, b) => a - b)

        // const productCategoriesAndTags = await prisma.product.update({
        //     where: { id: product.id },
        //     data: {
        //         categories: {
        //             connect: [
        //                 ...categoryIds.map(category => ({
        //                     id: category,
        //                 }))
        //             ],
        //         },
        //         tags: {
        //             connect: [
        //                 ...tagIds.map(tag => ({
        //                     id: tag,
        //                 }))
        //             ],
        //         }
        //     }
        // })

        await prisma.product.update({
            where: { id: product.id },
            data: {
                categories: {
                    connect: categories,
                },
            }
        })

        const totalQuantity = await getProductTotalQuantity(product.id)

        await prisma.product.update({
            where: {
                id: product.id
            },
            data: {
                totalQuantity
            }
        })
    }

    console.log('Products seeded successfully')
}

const getProductTotalQuantity = async (productId: string) => {
    const productVariants = await prisma.productVariant.findMany({
        where: {
            productId: productId
        }
    })

    const totalQuantity = productVariants.reduce((acc, variant) => {
        return acc + variant.quantity
    }, 0)

    return totalQuantity
}

const currenciesData = [
    {
        code: 'USD',
        name: 'US Dollar',
        exchangeRate: 1,
        isDefault: true,
        isActive: true,
    },
    {
        code: 'NGN',
        name: 'Naira',
        exchangeRate: 1075.75,
        isDefault: false,
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
                    { name: 'Loungewear' },
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
                    { name: 'Caps' },
                    { name: 'Scarf' },
                    { name: 'Wallets' },
                    { name: 'Bags' },
                    { name: 'Purses' },
                    { name: 'Pens' },
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
                    { name: 'Caps' },
                    { name: 'Scarf' },
                    { name: 'Wallets' },
                    { name: 'Bags' },
                    { name: 'Purses' },
                    { name: 'Pens' },
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
    await prisma.admin.deleteMany({})
    await seedAdmin()
    await prisma.currency.deleteMany({})
    await seedCurrencies(currenciesData)
    await prisma.category.deleteMany({})
    await seedCategories(categoriesData)
    await prisma.payment.deleteMany({})
    await prisma.orderItem.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.productVariant.deleteMany({})
    await prisma.productImage.deleteMany({})
    await prisma.productReview.deleteMany({})
    await prisma.product.deleteMany({})
    // await seedProducts(20)
    await seedProductsFromJsonFile()
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