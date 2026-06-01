"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressCoinsTransactionConfirmedEachConfirmationData = void 0;
var AddressCoinsTransactionConfirmedEachConfirmationData = (function () {
    function AddressCoinsTransactionConfirmedEachConfirmationData() {
    }
    AddressCoinsTransactionConfirmedEachConfirmationData.getAttributeTypeMap = function () {
        return AddressCoinsTransactionConfirmedEachConfirmationData.attributeTypeMap;
    };
    AddressCoinsTransactionConfirmedEachConfirmationData.discriminator = undefined;
    AddressCoinsTransactionConfirmedEachConfirmationData.attributeTypeMap = [
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
            "type": "AddressCoinsTransactionConfirmedEachConfirmationDataItem"
        }
    ];
    return AddressCoinsTransactionConfirmedEachConfirmationData;
}());
exports.AddressCoinsTransactionConfirmedEachConfirmationData = AddressCoinsTransactionConfirmedEachConfirmationData;
//# sourceMappingURL=addressCoinsTransactionConfirmedEachConfirmationData.js.map