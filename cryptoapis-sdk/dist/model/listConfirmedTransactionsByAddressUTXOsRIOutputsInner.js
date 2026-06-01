"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOsRIOutputsInner = void 0;
var ListConfirmedTransactionsByAddressUTXOsRIOutputsInner = (function () {
    function ListConfirmedTransactionsByAddressUTXOsRIOutputsInner() {
    }
    ListConfirmedTransactionsByAddressUTXOsRIOutputsInner.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOsRIOutputsInner.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOsRIOutputsInner.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOsRIOutputsInner.attributeTypeMap = [
        {
            "name": "addresses",
            "baseName": "addresses",
            "type": "Array<string>"
        },
        {
            "name": "isSpent",
            "baseName": "isSpent",
            "type": "boolean"
        },
        {
            "name": "script",
            "baseName": "script",
            "type": "ListConfirmedTransactionsByAddressUTXOsRIOutputsInnerScript"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListConfirmedTransactionsByAddressUTXOsRIInputsInnerValue"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOsRIOutputsInner;
}());
exports.ListConfirmedTransactionsByAddressUTXOsRIOutputsInner = ListConfirmedTransactionsByAddressUTXOsRIOutputsInner;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOsRIOutputsInner.js.map