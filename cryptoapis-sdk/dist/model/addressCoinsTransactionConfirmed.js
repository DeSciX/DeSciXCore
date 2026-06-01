"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressCoinsTransactionConfirmed = void 0;
var AddressCoinsTransactionConfirmed = (function () {
    function AddressCoinsTransactionConfirmed() {
    }
    AddressCoinsTransactionConfirmed.getAttributeTypeMap = function () {
        return AddressCoinsTransactionConfirmed.attributeTypeMap;
    };
    AddressCoinsTransactionConfirmed.discriminator = undefined;
    AddressCoinsTransactionConfirmed.attributeTypeMap = [
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
            "type": "AddressCoinsTransactionConfirmedData"
        }
    ];
    return AddressCoinsTransactionConfirmed;
}());
exports.AddressCoinsTransactionConfirmed = AddressCoinsTransactionConfirmed;
//# sourceMappingURL=addressCoinsTransactionConfirmed.js.map