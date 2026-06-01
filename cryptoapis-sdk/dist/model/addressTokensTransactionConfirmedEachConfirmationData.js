"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressTokensTransactionConfirmedEachConfirmationData = void 0;
var AddressTokensTransactionConfirmedEachConfirmationData = (function () {
    function AddressTokensTransactionConfirmedEachConfirmationData() {
    }
    AddressTokensTransactionConfirmedEachConfirmationData.getAttributeTypeMap = function () {
        return AddressTokensTransactionConfirmedEachConfirmationData.attributeTypeMap;
    };
    AddressTokensTransactionConfirmedEachConfirmationData.discriminator = undefined;
    AddressTokensTransactionConfirmedEachConfirmationData.attributeTypeMap = [
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
            "type": "AddressTokensTransactionConfirmedEachConfirmationDataItem"
        }
    ];
    return AddressTokensTransactionConfirmedEachConfirmationData;
}());
exports.AddressTokensTransactionConfirmedEachConfirmationData = AddressTokensTransactionConfirmedEachConfirmationData;
//# sourceMappingURL=addressTokensTransactionConfirmedEachConfirmationData.js.map