"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KaspaAddressCoinsTransactionConfirmedData = void 0;
var KaspaAddressCoinsTransactionConfirmedData = (function () {
    function KaspaAddressCoinsTransactionConfirmedData() {
    }
    KaspaAddressCoinsTransactionConfirmedData.getAttributeTypeMap = function () {
        return KaspaAddressCoinsTransactionConfirmedData.attributeTypeMap;
    };
    KaspaAddressCoinsTransactionConfirmedData.discriminator = undefined;
    KaspaAddressCoinsTransactionConfirmedData.attributeTypeMap = [
        {
            "name": "product",
            "baseName": "product",
            "type": "string"
        },
        {
            "name": "event",
            "baseName": "event",
            "type": "string"
        },
        {
            "name": "item",
            "baseName": "item",
            "type": "KaspaAddressCoinsTransactionConfirmedDataItem"
        }
    ];
    return KaspaAddressCoinsTransactionConfirmedData;
}());
exports.KaspaAddressCoinsTransactionConfirmedData = KaspaAddressCoinsTransactionConfirmedData;
//# sourceMappingURL=kaspaAddressCoinsTransactionConfirmedData.js.map