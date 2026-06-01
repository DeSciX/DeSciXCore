"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KaspaAddressCoinsTransactionConfirmed = void 0;
var KaspaAddressCoinsTransactionConfirmed = (function () {
    function KaspaAddressCoinsTransactionConfirmed() {
    }
    KaspaAddressCoinsTransactionConfirmed.getAttributeTypeMap = function () {
        return KaspaAddressCoinsTransactionConfirmed.attributeTypeMap;
    };
    KaspaAddressCoinsTransactionConfirmed.discriminator = undefined;
    KaspaAddressCoinsTransactionConfirmed.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "referenceId",
            "baseName": "referenceId",
            "type": "string"
        },
        {
            "name": "idempotencyKey",
            "baseName": "idempotencyKey",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "KaspaAddressCoinsTransactionConfirmedData"
        }
    ];
    return KaspaAddressCoinsTransactionConfirmed;
}());
exports.KaspaAddressCoinsTransactionConfirmed = KaspaAddressCoinsTransactionConfirmed;
//# sourceMappingURL=kaspaAddressCoinsTransactionConfirmed.js.map