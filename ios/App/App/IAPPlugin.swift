import Foundation
import Capacitor
import StoreKit

@objc(IAPPlugin)
public class IAPPlugin: CAPPlugin, SKProductsRequestDelegate, SKPaymentTransactionObserver {

    private var productsRequest: SKProductsRequest?
    private var productsCall: CAPPluginCall?
    private var purchaseCall: CAPPluginCall?
    private var loadedProducts: [String: SKProduct] = [:]

    // Add transaction observer when plugin loads
    override public func load() {
        SKPaymentQueue.default().add(self)
    }

    deinit {
        SKPaymentQueue.default().remove(self)
    }

    // MARK: - JS-callable methods

    @objc func getProducts(_ call: CAPPluginCall) {
        guard let productIds = call.getArray("productIds", String.self), !productIds.isEmpty else {
            call.reject("productIds array is required")
            return
        }
        productsCall = call
        let request = SKProductsRequest(productIdentifiers: Set(productIds))
        request.delegate = self
        productsRequest = request
        request.start()
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("productId is required")
            return
        }
        guard SKPaymentQueue.canMakePayments() else {
            call.reject("In-app purchases are not allowed on this device")
            return
        }
        guard let product = loadedProducts[productId] else {
            call.reject("Product not found — call getProducts first")
            return
        }
        purchaseCall = call
        SKPaymentQueue.default().add(SKPayment(product: product))
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        purchaseCall = call
        SKPaymentQueue.default().restoreCompletedTransactions()
    }

    @objc func getReceiptData(_ call: CAPPluginCall) {
        guard let receiptURL = Bundle.main.appStoreReceiptURL,
              FileManager.default.fileExists(atPath: receiptURL.path),
              let data = try? Data(contentsOf: receiptURL) else {
            call.reject("No App Store receipt found")
            return
        }
        call.resolve(["receipt": data.base64EncodedString()])
    }

    // MARK: - SKProductsRequestDelegate

    public func productsRequest(_ request: SKProductsRequest, didReceive response: SKProductsResponse) {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency

        var list: [[String: Any]] = []
        for product in response.products {
            loadedProducts[product.productIdentifier] = product
            formatter.locale = product.priceLocale
            list.append([
                "productId": product.productIdentifier,
                "title": product.localizedTitle,
                "description": product.localizedDescription,
                "price": formatter.string(from: product.price) ?? "\(product.price)",
                "priceValue": product.price.doubleValue
            ])
        }
        productsCall?.resolve(["products": list])
        productsCall = nil
    }

    public func request(_ request: SKRequest, didFailWithError error: Error) {
        productsCall?.reject(error.localizedDescription)
        productsCall = nil
    }

    // MARK: - SKPaymentTransactionObserver

    public func paymentQueue(_ queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
        for tx in transactions {
            switch tx.transactionState {
            case .purchased, .restored:
                let receipt = receiptBase64()
                purchaseCall?.resolve([
                    "productId": tx.payment.productIdentifier,
                    "transactionId": tx.transactionIdentifier ?? "",
                    "receipt": receipt
                ])
                purchaseCall = nil
                SKPaymentQueue.default().finishTransaction(tx)

            case .failed:
                let err = tx.error as? SKError
                if err?.code == .paymentCancelled {
                    purchaseCall?.reject("cancelled")
                } else {
                    purchaseCall?.reject(tx.error?.localizedDescription ?? "Purchase failed")
                }
                purchaseCall = nil
                SKPaymentQueue.default().finishTransaction(tx)

            case .deferred, .purchasing:
                break

            @unknown default:
                break
            }
        }
    }

    public func paymentQueueRestoreCompletedTransactionsFinished(_ queue: SKPaymentQueue) {
        purchaseCall?.resolve(["productId": "restored", "transactionId": "restored", "receipt": receiptBase64()])
        purchaseCall = nil
    }

    public func paymentQueue(_ queue: SKPaymentQueue, restoreCompletedTransactionsFailedWithError error: Error) {
        purchaseCall?.reject(error.localizedDescription)
        purchaseCall = nil
    }

    // MARK: - Helpers

    private func receiptBase64() -> String {
        guard let url = Bundle.main.appStoreReceiptURL,
              let data = try? Data(contentsOf: url) else { return "" }
        return data.base64EncodedString()
    }
}
