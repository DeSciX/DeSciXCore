"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressCoinsTransactionUnconfirmedData = void 0;
var AddressCoinsTransactionUnconfirmedData = (function () {
    function AddressCoinsTransactionUnconfirmedData() {
    }
    AddressCoinsTransactionUnconfirmedData.getAttributeTypeMap = function () {
        return AddressCoinsTransactionUnconfirmedData.attributeTypeMap;
    };
    AddressCoinsTransactionUnconfirmedData.discriminator = undefined;
    AddressCoinsTransactionUnconfirmedData.attributeTypeMap = [
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
            "type": "AddressCoinsTransactionUnconfirmedDataItem"
        }
    ];
    return AddressCoinsTransactionUnconfirmedData;
}());
exports.AddressCoinsTransactionUnconfirmedData = AddressCoinsTransactionUnconfirmedData;
//# sourceMappingURL=addressCoinsTransactionUnconfirmedData.js.map