"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressTokensTransactionConfirmed = void 0;
var AddressTokensTransactionConfirmed = (function () {
    function AddressTokensTransactionConfirmed() {
    }
    AddressTokensTransactionConfirmed.getAttributeTypeMap = function () {
        return AddressTokensTransactionConfirmed.attributeTypeMap;
    };
    AddressTokensTransactionConfirmed.discriminator = undefined;
    AddressTokensTransactionConfirmed.attributeTypeMap = [
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
            "type": "AddressTokensTransactionConfirmedData"
        }
    ];
    return AddressTokensTransactionConfirmed;
}());
exports.AddressTokensTransactionConfirmed = AddressTokensTransactionConfirmed;
//# sourceMappingURL=addressTokensTransactionConfirmed.js.map