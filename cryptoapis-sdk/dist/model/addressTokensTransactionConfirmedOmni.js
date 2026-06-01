"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressTokensTransactionConfirmedOmni = void 0;
var AddressTokensTransactionConfirmedOmni = (function () {
    function AddressTokensTransactionConfirmedOmni() {
    }
    AddressTokensTransactionConfirmedOmni.getAttributeTypeMap = function () {
        return AddressTokensTransactionConfirmedOmni.attributeTypeMap;
    };
    AddressTokensTransactionConfirmedOmni.discriminator = undefined;
    AddressTokensTransactionConfirmedOmni.attributeTypeMap = [
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "propertyId",
            "baseName": "propertyId",
            "type": "string"
        },
        {
            "name": "transactionType",
            "baseName": "transactionType",
            "type": "string"
        },
        {
            "name": "createdByTransactionId",
            "baseName": "createdByTransactionId",
            "type": "string"
        },
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        }
    ];
    return AddressTokensTransactionConfirmedOmni;
}());
exports.AddressTokensTransactionConfirmedOmni = AddressTokensTransactionConfirmedOmni;
//# sourceMappingURL=addressTokensTransactionConfirmedOmni.js.map