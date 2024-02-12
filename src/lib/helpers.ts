const getAmount = (amount: number) => {
    return amount / 100
}

const setAmount = (amount: number) => {
    return amount * 100
}

const generateRandomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+'

    let randomString = ''
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        randomString += characters.charAt(randomIndex)
    }

    return randomString
}

const slugify = (word: string) => {
    return word.toLowerCase().replace(/\s+/g, '-')
}

const randomSelect = (list: string[]) => {
    const randomIndex = Math.floor(Math.random() * list.length)
    return list[randomIndex]
}

export {
    getAmount,
    setAmount,
    generateRandomString,
    slugify,
    randomSelect,
}