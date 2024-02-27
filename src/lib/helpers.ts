const generateRandomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+'

    let randomString = ''
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        randomString += characters.charAt(randomIndex)
    }

    return randomString
}

const generateRandomStringWithoutSymbols = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    let randomString = ''
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        randomString += characters.charAt(randomIndex)
    }

    return randomString
}

const randomSelect = (list: string[]) => {
    const randomIndex = Math.floor(Math.random() * list.length)
    return list[randomIndex]
}

export {
    generateRandomString,
    generateRandomStringWithoutSymbols,
    randomSelect,
}