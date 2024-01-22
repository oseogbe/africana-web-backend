import { PrismaClient } from '@prisma/client'
import { seedCategories } from "./category.seeder"

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

async function runSeeders() {
    // Seed categories
    await prisma.category.deleteMany({})
    await seedCategories(prisma, categoriesData);
}

runSeeders()
    .catch((error) => {
        console.log(error)
    })
    .finally(async () => {
        prisma.$disconnect()
        process.exit()
    })