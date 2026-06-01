"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashUTXOsRData = void 0;
var ListTransactionsByBlockHashUTXOsRData = (function () {
    function ListTransactionsByBlockHashUTXOsRData() {
    }
    ListTransactionsByBlockHashUTXOsRData.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashUTXOsRData.attributeTypeMap;
    };
    ListTransactionsByBlockHashUTXOsRData.discriminator = undefined;
    ListTransactionsByBlockHashUTXOsRData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "offset",
            "baseName": "offset",
            "type": "number"
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<ListTransactionsByBlockHashUTXOsRI>"
        }
    ];
    return ListTransactionsByBlockHashUTXOsRData;
}());
exports.ListTransactionsByBlockHashUTXOsRData = ListTransactionsByBlockHashUTXOsRData;
//# sourceMappingURL=listTransactionsByBlockHashUTXOsRData.js.map