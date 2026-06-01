"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressInternalTransactionConfirmed = void 0;
var AddressInternalTransactionConfirmed = (function () {
    function AddressInternalTransactionConfirmed() {
    }
    AddressInternalTransactionConfirmed.getAttributeTypeMap = function () {
        return AddressInternalTransactionConfirmed.attributeTypeMap;
    };
    AddressInternalTransactionConfirmed.discriminator = undefined;
    AddressInternalTransactionConfirmed.attributeTypeMap = [
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
            "type": "AddressInternalTransactionConfirmedData"
        }
    ];
    return AddressInternalTransactionConfirmed;
}());
exports.AddressInternalTransactionConfirmed = AddressInternalTransactionConfirmed;
//# sourceMappingURL=addressInternalTransactionConfirmed.js.map