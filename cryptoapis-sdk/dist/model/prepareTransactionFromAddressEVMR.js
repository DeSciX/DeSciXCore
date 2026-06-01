"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareTransactionFromAddressEVMR = void 0;
var PrepareTransactionFromAddressEVMR = (function () {
    function PrepareTransactionFromAddressEVMR() {
    }
    PrepareTransactionFromAddressEVMR.getAttributeTypeMap = function () {
        return PrepareTransactionFromAddressEVMR.attributeTypeMap;
    };
    PrepareTransactionFromAddressEVMR.discriminator = undefined;
    PrepareTransactionFromAddressEVMR.attributeTypeMap = [
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
            "name": "data",
            "baseName": "data",
            "type": "PrepareTransactionFromAddressEVMRData"
        }
    ];
    return PrepareTransactionFromAddressEVMR;
}());
exports.PrepareTransactionFromAddressEVMR = PrepareTransactionFromAddressEVMR;
//# sourceMappingURL=prepareTransactionFromAddressEVMR.js.map