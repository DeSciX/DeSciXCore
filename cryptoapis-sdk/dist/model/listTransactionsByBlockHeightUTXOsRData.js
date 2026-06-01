"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightUTXOsRData = void 0;
var ListTransactionsByBlockHeightUTXOsRData = (function () {
    function ListTransactionsByBlockHeightUTXOsRData() {
    }
    ListTransactionsByBlockHeightUTXOsRData.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightUTXOsRData.attributeTypeMap;
    };
    ListTransactionsByBlockHeightUTXOsRData.discriminator = undefined;
    ListTransactionsByBlockHeightUTXOsRData.attributeTypeMap = [
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
            "type": "Array<ListTransactionsByBlockHeightUTXOsRI>"
        }
    ];
    return ListTransactionsByBlockHeightUTXOsRData;
}());
exports.ListTransactionsByBlockHeightUTXOsRData = ListTransactionsByBlockHeightUTXOsRData;
//# sourceMappingURL=listTransactionsByBlockHeightUTXOsRData.js.map