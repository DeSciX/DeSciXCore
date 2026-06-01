"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressCoinsTransactionConfirmedData = void 0;
var AddressCoinsTransactionConfirmedData = (function () {
    function AddressCoinsTransactionConfirmedData() {
    }
    AddressCoinsTransactionConfirmedData.getAttributeTypeMap = function () {
        return AddressCoinsTransactionConfirmedData.attributeTypeMap;
    };
    AddressCoinsTransactionConfirmedData.discriminator = undefined;
    AddressCoinsTransactionConfirmedData.attributeTypeMap = [
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
            "type": "AddressCoinsTransactionConfirmedDataItem"
        }
    ];
    return AddressCoinsTransactionConfirmedData;
}());
exports.AddressCoinsTransactionConfirmedData = AddressCoinsTransactionConfirmedData;
//# sourceMappingURL=addressCoinsTransactionConfirmedData.js.map