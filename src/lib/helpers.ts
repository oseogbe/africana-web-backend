const getAmount = (amount: number) => {
    return amount / 100
}

const setAmount = (amount: number) => {
    return amount * 100
}

const generateRandomPassword = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+'
    const passwordLength = 8

    let randomPassword = ''
    for (let i = 0; i < passwordLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        randomPassword += characters.charAt(randomIndex)
    }

    return randomPassword
}

const slugify = (word: string) => {
    return word.toLowerCase().replace(/\s+/g, '-')
}

export {
    getAmount,
    setAmount,
    generateRandomPassword,
    slugify
}