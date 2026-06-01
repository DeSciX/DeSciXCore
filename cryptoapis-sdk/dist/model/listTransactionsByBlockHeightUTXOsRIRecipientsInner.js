"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightUTXOsRIRecipientsInner = void 0;
var ListTransactionsByBlockHeightUTXOsRIRecipientsInner = (function () {
    function ListTransactionsByBlockHeightUTXOsRIRecipientsInner() {
    }
    ListTransactionsByBlockHeightUTXOsRIRecipientsInner.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightUTXOsRIRecipientsInner.attributeTypeMap;
    };
    ListTransactionsByBlockHeightUTXOsRIRecipientsInner.discriminator = undefined;
    ListTransactionsByBlockHeightUTXOsRIRecipientsInner.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListTransactionsByBlockHeightUTXOsRIRecipientsInnerValue"
        },
        {
            "name": "addresses",
            "baseName": "addresses",
            "type": "string"
        }
    ];
    return ListTransactionsByBlockHeightUTXOsRIRecipientsInner;
}());
exports.ListTransactionsByBlockHeightUTXOsRIRecipientsInner = ListTransactionsByBlockHeightUTXOsRIRecipientsInner;
//# sourceMappingURL=listTransactionsByBlockHeightUTXOsRIRecipientsInner.js.map