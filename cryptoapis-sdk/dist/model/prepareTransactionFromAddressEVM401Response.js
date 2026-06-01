"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareTransactionFromAddressEVM401Response = void 0;
var PrepareTransactionFromAddressEVM401Response = (function () {
    function PrepareTransactionFromAddressEVM401Response() {
    }
    PrepareTransactionFromAddressEVM401Response.getAttributeTypeMap = function () {
        return PrepareTransactionFromAddressEVM401Response.attributeTypeMap;
    };
    PrepareTransactionFromAddressEVM401Response.discriminator = undefined;
    PrepareTransactionFromAddressEVM401Response.attributeTypeMap = [
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
            "type": "PrepareTransactionFromAddressEVME401"
        }
    ];
    return PrepareTransactionFromAddressEVM401Response;
}());
exports.PrepareTransactionFromAddressEVM401Response = PrepareTransactionFromAddressEVM401Response;
//# sourceMappingURL=prepareTransactionFromAddressEVM401Response.js.map