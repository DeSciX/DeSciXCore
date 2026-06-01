"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightEVM403Response = void 0;
var ListTransactionsByBlockHeightEVM403Response = (function () {
    function ListTransactionsByBlockHeightEVM403Response() {
    }
    ListTransactionsByBlockHeightEVM403Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightEVM403Response.attributeTypeMap;
    };
    ListTransactionsByBlockHeightEVM403Response.discriminator = undefined;
    ListTransactionsByBlockHeightEVM403Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHeightEVME403"
        }
    ];
    return ListTransactionsByBlockHeightEVM403Response;
}());
exports.ListTransactionsByBlockHeightEVM403Response = ListTransactionsByBlockHeightEVM403Response;
//# sourceMappingURL=listTransactionsByBlockHeightEVM403Response.js.map