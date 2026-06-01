"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightEVM401Response = void 0;
var ListTransactionsByBlockHeightEVM401Response = (function () {
    function ListTransactionsByBlockHeightEVM401Response() {
    }
    ListTransactionsByBlockHeightEVM401Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightEVM401Response.attributeTypeMap;
    };
    ListTransactionsByBlockHeightEVM401Response.discriminator = undefined;
    ListTransactionsByBlockHeightEVM401Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHeightEVME401"
        }
    ];
    return ListTransactionsByBlockHeightEVM401Response;
}());
exports.ListTransactionsByBlockHeightEVM401Response = ListTransactionsByBlockHeightEVM401Response;
//# sourceMappingURL=listTransactionsByBlockHeightEVM401Response.js.map