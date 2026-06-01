"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashXRPRData = void 0;
var ListTransactionsByBlockHashXRPRData = (function () {
    function ListTransactionsByBlockHashXRPRData() {
    }
    ListTransactionsByBlockHashXRPRData.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashXRPRData.attributeTypeMap;
    };
    ListTransactionsByBlockHashXRPRData.discriminator = undefined;
    ListTransactionsByBlockHashXRPRData.attributeTypeMap = [
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
            "type": "Array<ListTransactionsByBlockHashXRPRI>"
        }
    ];
    return ListTransactionsByBlockHashXRPRData;
}());
exports.ListTransactionsByBlockHashXRPRData = ListTransactionsByBlockHashXRPRData;
//# sourceMappingURL=listTransactionsByBlockHashXRPRData.js.map