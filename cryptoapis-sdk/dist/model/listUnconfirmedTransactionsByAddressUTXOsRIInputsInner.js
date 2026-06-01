"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnconfirmedTransactionsByAddressUTXOsRIInputsInner = void 0;
var ListUnconfirmedTransactionsByAddressUTXOsRIInputsInner = (function () {
    function ListUnconfirmedTransactionsByAddressUTXOsRIInputsInner() {
    }
    ListUnconfirmedTransactionsByAddressUTXOsRIInputsInner.getAttributeTypeMap = function () {
        return ListUnconfirmedTransactionsByAddressUTXOsRIInputsInner.attributeTypeMap;
    };
    ListUnconfirmedTransactionsByAddressUTXOsRIInputsInner.discriminator = undefined;
    ListUnconfirmedTransactionsByAddressUTXOsRIInputsInner.attributeTypeMap = [
        {
            "name": "addresses",
            "baseName": "addresses",
            "type": "Array<string>"
        },
        {
            "name": "outputIndex",
            "baseName": "outputIndex",
            "type": "number"
        },
        {
            "name": "script",
            "baseName": "script",
            "type": "ListUnconfirmedTransactionsByAddressUTXOsRIInputsInnerScript"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListUnconfirmedTransactionsByAddressUTXOsRIInputsInnerValue"
        },
        {
            "name": "witnesses",
            "baseName": "witnesses",
            "type": "Array<string>"
        }
    ];
    return ListUnconfirmedTransactionsByAddressUTXOsRIInputsInner;
}());
exports.ListUnconfirmedTransactionsByAddressUTXOsRIInputsInner = ListUnconfirmedTransactionsByAddressUTXOsRIInputsInner;
//# sourceMappingURL=listUnconfirmedTransactionsByAddressUTXOsRIInputsInner.js.map