import PaymentProvider from "@/interfaces/PaymentProvider"

class PaymentService {
    constructor(private paymentProvider: PaymentProvider) { }

    initiatePayment(email: string, orderId: string, amount: number) {
        return this.paymentProvider.initiatePayment(email, orderId, amount)
    }

    verifyTransaction(transactionId: string) {
        return this.paymentProvider.verifyTransaction(transactionId)
    }
}

export default PaymentService