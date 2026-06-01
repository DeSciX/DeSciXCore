"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressCoinsTransactionUnconfirmed = void 0;
var AddressCoinsTransactionUnconfirmed = (function () {
    function AddressCoinsTransactionUnconfirmed() {
    }
    AddressCoinsTransactionUnconfirmed.getAttributeTypeMap = function () {
        return AddressCoinsTransactionUnconfirmed.attributeTypeMap;
    };
    AddressCoinsTransactionUnconfirmed.discriminator = undefined;
    AddressCoinsTransactionUnconfirmed.attributeTypeMap = [
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
            "type": "AddressCoinsTransactionUnconfirmedData"
        }
    ];
    return AddressCoinsTransactionUnconfirmed;
}());
exports.AddressCoinsTransactionUnconfirmed = AddressCoinsTransactionUnconfirmed;
//# sourceMappingURL=addressCoinsTransactionUnconfirmed.js.map