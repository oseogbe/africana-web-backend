const getAmount = (amount: number) => {
    return amount / 100;
}

const setAmount = (amount: number) => {
    return amount * 100;
}

export {
    getAmount,
    setAmount
}