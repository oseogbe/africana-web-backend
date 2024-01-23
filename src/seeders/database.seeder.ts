import { PrismaClient } from '@prisma/client'
import { seedCategories } from "./category.seeder"
import { seedCurrencies } from "./currency.seeder"

const prisma = new PrismaClient()

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

const currenciesData = [
    {
        code: 'NGN',
        name: 'Naira',
        exchangeRate: 1.00,
        isDefault: true,
        isActive: true
    }
]

async function runSeeders() {
    // Seed categories
    // await prisma.category.deleteMany({})
    // await seedCategories(prisma, categoriesData)

    await seedCurrencies(prisma, currenciesData)
}

runSeeders()
    .catch((error) => {
        console.log(error)
    })
    .finally(async () => {
        await prisma.$disconnect()
        process.exit()
    })