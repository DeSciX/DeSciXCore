"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightXRPRData = void 0;
var ListTransactionsByBlockHeightXRPRData = (function () {
    function ListTransactionsByBlockHeightXRPRData() {
    }
    ListTransactionsByBlockHeightXRPRData.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightXRPRData.attributeTypeMap;
    };
    ListTransactionsByBlockHeightXRPRData.discriminator = undefined;
    ListTransactionsByBlockHeightXRPRData.attributeTypeMap = [
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
            "type": "Array<ListTransactionsByBlockHeightXRPRI>"
        }
    ];
    return ListTransactionsByBlockHeightXRPRData;
}());
exports.ListTransactionsByBlockHeightXRPRData = ListTransactionsByBlockHeightXRPRData;
//# sourceMappingURL=listTransactionsByBlockHeightXRPRData.js.map