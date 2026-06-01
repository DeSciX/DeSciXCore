"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashXRP400Response = void 0;
var ListTransactionsByBlockHashXRP400Response = (function () {
    function ListTransactionsByBlockHashXRP400Response() {
    }
    ListTransactionsByBlockHashXRP400Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashXRP400Response.attributeTypeMap;
    };
    ListTransactionsByBlockHashXRP400Response.discriminator = undefined;
    ListTransactionsByBlockHashXRP400Response.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "error",
            "baseName": "error",
            "type": "ListTransactionsByBlockHashXRPE400"
        }
    ];
    return ListTransactionsByBlockHashXRP400Response;
}());
exports.ListTransactionsByBlockHashXRP400Response = ListTransactionsByBlockHashXRP400Response;
//# sourceMappingURL=listTransactionsByBlockHashXRP400Response.js.map