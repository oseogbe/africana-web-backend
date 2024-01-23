import { Prisma, PrismaClient } from "@prisma/client"

export async function seedCurrencies(prisma: PrismaClient, currenciesData: Prisma.CurrencyCreateInput[]) {

    for (const currency of currenciesData) {
        await prisma.currency.create({
            data: { ...currency },
        })
    }

    console.log('Currencies seeded successfully')
}
