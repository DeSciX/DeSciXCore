"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionIdKaspaRIInputsInner = void 0;
var GetTransactionDetailsByTransactionIdKaspaRIInputsInner = (function () {
    function GetTransactionDetailsByTransactionIdKaspaRIInputsInner() {
    }
    GetTransactionDetailsByTransactionIdKaspaRIInputsInner.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionIdKaspaRIInputsInner.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionIdKaspaRIInputsInner.discriminator = undefined;
    GetTransactionDetailsByTransactionIdKaspaRIInputsInner.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "outputIndex",
            "baseName": "outputIndex",
            "type": "number"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "GetTransactionDetailsByTransactionIdKaspaRIInputsInnerValue"
        }
    ];
    return GetTransactionDetailsByTransactionIdKaspaRIInputsInner;
}());
exports.GetTransactionDetailsByTransactionIdKaspaRIInputsInner = GetTransactionDetailsByTransactionIdKaspaRIInputsInner;
//# sourceMappingURL=getTransactionDetailsByTransactionIdKaspaRIInputsInner.js.map