"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashEVMR = void 0;
var GetTransactionDetailsByTransactionHashEVMR = (function () {
    function GetTransactionDetailsByTransactionHashEVMR() {
    }
    GetTransactionDetailsByTransactionHashEVMR.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashEVMR.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashEVMR.discriminator = undefined;
    GetTransactionDetailsByTransactionHashEVMR.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashEVMRData"
        }
    ];
    return GetTransactionDetailsByTransactionHashEVMR;
}());
exports.GetTransactionDetailsByTransactionHashEVMR = GetTransactionDetailsByTransactionHashEVMR;
//# sourceMappingURL=getTransactionDetailsByTransactionHashEVMR.js.map