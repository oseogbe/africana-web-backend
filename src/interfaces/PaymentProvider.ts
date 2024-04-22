export default interface PaymentProvider {
    initiatePayment(email: string, orderId: string, amount: number): any
    verifyTransaction(transactionId: string): any
} 