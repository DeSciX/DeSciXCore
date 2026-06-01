"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightEVM400Response = void 0;
var ListTransactionsByBlockHeightEVM400Response = (function () {
    function ListTransactionsByBlockHeightEVM400Response() {
    }
    ListTransactionsByBlockHeightEVM400Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightEVM400Response.attributeTypeMap;
    };
    ListTransactionsByBlockHeightEVM400Response.discriminator = undefined;
    ListTransactionsByBlockHeightEVM400Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHeightEVME400"
        }
    ];
    return ListTransactionsByBlockHeightEVM400Response;
}());
exports.ListTransactionsByBlockHeightEVM400Response = ListTransactionsByBlockHeightEVM400Response;
//# sourceMappingURL=listTransactionsByBlockHeightEVM400Response.js.map