"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightUTXOsRISendersInner = void 0;
var ListTransactionsByBlockHeightUTXOsRISendersInner = (function () {
    function ListTransactionsByBlockHeightUTXOsRISendersInner() {
    }
    ListTransactionsByBlockHeightUTXOsRISendersInner.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightUTXOsRISendersInner.attributeTypeMap;
    };
    ListTransactionsByBlockHeightUTXOsRISendersInner.discriminator = undefined;
    ListTransactionsByBlockHeightUTXOsRISendersInner.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListTransactionsByBlockHeightUTXOsRISendersInnerValue"
        },
        {
            "name": "addresses",
            "baseName": "addresses",
            "type": "string"
        }
    ];
    return ListTransactionsByBlockHeightUTXOsRISendersInner;
}());
exports.ListTransactionsByBlockHeightUTXOsRISendersInner = ListTransactionsByBlockHeightUTXOsRISendersInner;
//# sourceMappingURL=listTransactionsByBlockHeightUTXOsRISendersInner.js.map