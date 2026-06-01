"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInner = void 0;
var ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInner = (function () {
    function ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInner() {
    }
    ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInner.getAttributeTypeMap = function () {
        return ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInner.attributeTypeMap;
    };
    ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInner.discriminator = undefined;
    ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInner.attributeTypeMap = [
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
            "type": "ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInnerValue"
        }
    ];
    return ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInner;
}());
exports.ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInner = ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInner;
//# sourceMappingURL=listUnconfirmedTransactionsByAddressUTXOsRIOutputsInner.js.map