"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLogsByTransactionHashEVM403Response = void 0;
var ListLogsByTransactionHashEVM403Response = (function () {
    function ListLogsByTransactionHashEVM403Response() {
    }
    ListLogsByTransactionHashEVM403Response.getAttributeTypeMap = function () {
        return ListLogsByTransactionHashEVM403Response.attributeTypeMap;
    };
    ListLogsByTransactionHashEVM403Response.discriminator = undefined;
    ListLogsByTransactionHashEVM403Response.attributeTypeMap = [
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
            "type": "ListLogsByTransactionHashEVME403"
        }
    ];
    return ListLogsByTransactionHashEVM403Response;
}());
exports.ListLogsByTransactionHashEVM403Response = ListLogsByTransactionHashEVM403Response;
//# sourceMappingURL=listLogsByTransactionHashEVM403Response.js.map