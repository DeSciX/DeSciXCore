"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashUTXOsRIRecipientsInner = void 0;
var ListTransactionsByBlockHashUTXOsRIRecipientsInner = (function () {
    function ListTransactionsByBlockHashUTXOsRIRecipientsInner() {
    }
    ListTransactionsByBlockHashUTXOsRIRecipientsInner.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashUTXOsRIRecipientsInner.attributeTypeMap;
    };
    ListTransactionsByBlockHashUTXOsRIRecipientsInner.discriminator = undefined;
    ListTransactionsByBlockHashUTXOsRIRecipientsInner.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListTransactionsByBlockHashUTXOsRIRecipientsInnerValue"
        }
    ];
    return ListTransactionsByBlockHashUTXOsRIRecipientsInner;
}());
exports.ListTransactionsByBlockHashUTXOsRIRecipientsInner = ListTransactionsByBlockHashUTXOsRIRecipientsInner;
//# sourceMappingURL=listTransactionsByBlockHashUTXOsRIRecipientsInner.js.map