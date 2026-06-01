"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressTokensTransactionConfirmedData = void 0;
var AddressTokensTransactionConfirmedData = (function () {
    function AddressTokensTransactionConfirmedData() {
    }
    AddressTokensTransactionConfirmedData.getAttributeTypeMap = function () {
        return AddressTokensTransactionConfirmedData.attributeTypeMap;
    };
    AddressTokensTransactionConfirmedData.discriminator = undefined;
    AddressTokensTransactionConfirmedData.attributeTypeMap = [
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
            "type": "AddressTokensTransactionConfirmedDataItem"
        }
    ];
    return AddressTokensTransactionConfirmedData;
}());
exports.AddressTokensTransactionConfirmedData = AddressTokensTransactionConfirmedData;
//# sourceMappingURL=addressTokensTransactionConfirmedData.js.map