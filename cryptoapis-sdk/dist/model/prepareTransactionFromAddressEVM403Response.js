"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareTransactionFromAddressEVM403Response = void 0;
var PrepareTransactionFromAddressEVM403Response = (function () {
    function PrepareTransactionFromAddressEVM403Response() {
    }
    PrepareTransactionFromAddressEVM403Response.getAttributeTypeMap = function () {
        return PrepareTransactionFromAddressEVM403Response.attributeTypeMap;
    };
    PrepareTransactionFromAddressEVM403Response.discriminator = undefined;
    PrepareTransactionFromAddressEVM403Response.attributeTypeMap = [
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
            "type": "PrepareTransactionFromAddressEVME403"
        }
    ];
    return PrepareTransactionFromAddressEVM403Response;
}());
exports.PrepareTransactionFromAddressEVM403Response = PrepareTransactionFromAddressEVM403Response;
//# sourceMappingURL=prepareTransactionFromAddressEVM403Response.js.map