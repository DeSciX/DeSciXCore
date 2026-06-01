"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareTransactionFromAddressEVM400Response = void 0;
var PrepareTransactionFromAddressEVM400Response = (function () {
    function PrepareTransactionFromAddressEVM400Response() {
    }
    PrepareTransactionFromAddressEVM400Response.getAttributeTypeMap = function () {
        return PrepareTransactionFromAddressEVM400Response.attributeTypeMap;
    };
    PrepareTransactionFromAddressEVM400Response.discriminator = undefined;
    PrepareTransactionFromAddressEVM400Response.attributeTypeMap = [
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
            "type": "PrepareTransactionFromAddressEVME400"
        }
    ];
    return PrepareTransactionFromAddressEVM400Response;
}());
exports.PrepareTransactionFromAddressEVM400Response = PrepareTransactionFromAddressEVM400Response;
//# sourceMappingURL=prepareTransactionFromAddressEVM400Response.js.map