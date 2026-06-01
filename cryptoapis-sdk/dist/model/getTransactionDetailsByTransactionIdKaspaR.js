"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionIdKaspaR = void 0;
var GetTransactionDetailsByTransactionIdKaspaR = (function () {
    function GetTransactionDetailsByTransactionIdKaspaR() {
    }
    GetTransactionDetailsByTransactionIdKaspaR.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionIdKaspaR.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionIdKaspaR.discriminator = undefined;
    GetTransactionDetailsByTransactionIdKaspaR.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionIdKaspaRData"
        }
    ];
    return GetTransactionDetailsByTransactionIdKaspaR;
}());
exports.GetTransactionDetailsByTransactionIdKaspaR = GetTransactionDetailsByTransactionIdKaspaR;
//# sourceMappingURL=getTransactionDetailsByTransactionIdKaspaR.js.map