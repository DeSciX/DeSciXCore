"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressInternalTransactionConfirmedEachConfirmation = void 0;
var AddressInternalTransactionConfirmedEachConfirmation = (function () {
    function AddressInternalTransactionConfirmedEachConfirmation() {
    }
    AddressInternalTransactionConfirmedEachConfirmation.getAttributeTypeMap = function () {
        return AddressInternalTransactionConfirmedEachConfirmation.attributeTypeMap;
    };
    AddressInternalTransactionConfirmedEachConfirmation.discriminator = undefined;
    AddressInternalTransactionConfirmedEachConfirmation.attributeTypeMap = [
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
            "type": "AddressInternalTransactionConfirmedEachConfirmationData"
        }
    ];
    return AddressInternalTransactionConfirmedEachConfirmation;
}());
exports.AddressInternalTransactionConfirmedEachConfirmation = AddressInternalTransactionConfirmedEachConfirmation;
//# sourceMappingURL=addressInternalTransactionConfirmedEachConfirmation.js.map