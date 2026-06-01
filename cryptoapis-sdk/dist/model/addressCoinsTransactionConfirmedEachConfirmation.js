"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressCoinsTransactionConfirmedEachConfirmation = void 0;
var AddressCoinsTransactionConfirmedEachConfirmation = (function () {
    function AddressCoinsTransactionConfirmedEachConfirmation() {
    }
    AddressCoinsTransactionConfirmedEachConfirmation.getAttributeTypeMap = function () {
        return AddressCoinsTransactionConfirmedEachConfirmation.attributeTypeMap;
    };
    AddressCoinsTransactionConfirmedEachConfirmation.discriminator = undefined;
    AddressCoinsTransactionConfirmedEachConfirmation.attributeTypeMap = [
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
            "type": "AddressCoinsTransactionConfirmedEachConfirmationData"
        }
    ];
    return AddressCoinsTransactionConfirmedEachConfirmation;
}());
exports.AddressCoinsTransactionConfirmedEachConfirmation = AddressCoinsTransactionConfirmedEachConfirmation;
//# sourceMappingURL=addressCoinsTransactionConfirmedEachConfirmation.js.map