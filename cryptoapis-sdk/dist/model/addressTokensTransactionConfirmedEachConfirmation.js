"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressTokensTransactionConfirmedEachConfirmation = void 0;
var AddressTokensTransactionConfirmedEachConfirmation = (function () {
    function AddressTokensTransactionConfirmedEachConfirmation() {
    }
    AddressTokensTransactionConfirmedEachConfirmation.getAttributeTypeMap = function () {
        return AddressTokensTransactionConfirmedEachConfirmation.attributeTypeMap;
    };
    AddressTokensTransactionConfirmedEachConfirmation.discriminator = undefined;
    AddressTokensTransactionConfirmedEachConfirmation.attributeTypeMap = [
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
            "type": "AddressTokensTransactionConfirmedEachConfirmationData"
        }
    ];
    return AddressTokensTransactionConfirmedEachConfirmation;
}());
exports.AddressTokensTransactionConfirmedEachConfirmation = AddressTokensTransactionConfirmedEachConfirmation;
//# sourceMappingURL=addressTokensTransactionConfirmedEachConfirmation.js.map