"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashUTXOsRISendersInner = void 0;
var ListTransactionsByBlockHashUTXOsRISendersInner = (function () {
    function ListTransactionsByBlockHashUTXOsRISendersInner() {
    }
    ListTransactionsByBlockHashUTXOsRISendersInner.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashUTXOsRISendersInner.attributeTypeMap;
    };
    ListTransactionsByBlockHashUTXOsRISendersInner.discriminator = undefined;
    ListTransactionsByBlockHashUTXOsRISendersInner.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListTransactionsByBlockHashUTXOsRISendersInnerValue"
        }
    ];
    return ListTransactionsByBlockHashUTXOsRISendersInner;
}());
exports.ListTransactionsByBlockHashUTXOsRISendersInner = ListTransactionsByBlockHashUTXOsRISendersInner;
//# sourceMappingURL=listTransactionsByBlockHashUTXOsRISendersInner.js.map