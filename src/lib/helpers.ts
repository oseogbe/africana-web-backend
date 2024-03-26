import slugify from "slugify"

const generateRandomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+'

    let randomString = ''
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        randomString += characters.charAt(randomIndex)
    }

    return randomString.toLowerCase()
}

const generateRandomStringWithoutSymbols = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    let randomString = ''
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        randomString += characters.charAt(randomIndex)
    }

    return randomString.toLowerCase()
}

const randomSelect = (list: string[]) => {
    const randomIndex = Math.floor(Math.random() * list.length)
    return list[randomIndex]
}

const slugifyStr = (name: string) => {
    return slugify(name, {
        remove: /[*+~.()'"!:@]/g,
        lower: true
    })
}

export {
    generateRandomString,
    generateRandomStringWithoutSymbols,
    randomSelect,
    slugifyStr,
}