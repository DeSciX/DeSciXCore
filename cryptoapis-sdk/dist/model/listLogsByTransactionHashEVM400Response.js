"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLogsByTransactionHashEVM400Response = void 0;
var ListLogsByTransactionHashEVM400Response = (function () {
    function ListLogsByTransactionHashEVM400Response() {
    }
    ListLogsByTransactionHashEVM400Response.getAttributeTypeMap = function () {
        return ListLogsByTransactionHashEVM400Response.attributeTypeMap;
    };
    ListLogsByTransactionHashEVM400Response.discriminator = undefined;
    ListLogsByTransactionHashEVM400Response.attributeTypeMap = [
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
            "type": "ListLogsByTransactionHashEVME400"
        }
    ];
    return ListLogsByTransactionHashEVM400Response;
}());
exports.ListLogsByTransactionHashEVM400Response = ListLogsByTransactionHashEVM400Response;
//# sourceMappingURL=listLogsByTransactionHashEVM400Response.js.map