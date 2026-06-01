"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashUTXOsRIInputsInner = void 0;
var GetTransactionDetailsByTransactionHashUTXOsRIInputsInner = (function () {
    function GetTransactionDetailsByTransactionHashUTXOsRIInputsInner() {
    }
    GetTransactionDetailsByTransactionHashUTXOsRIInputsInner.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashUTXOsRIInputsInner.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashUTXOsRIInputsInner.discriminator = undefined;
    GetTransactionDetailsByTransactionHashUTXOsRIInputsInner.attributeTypeMap = [
        {
            "name": "addresses",
            "baseName": "addresses",
            "type": "Array<string>"
        },
        {
            "name": "coinbase",
            "baseName": "coinbase",
            "type": "string"
        },
        {
            "name": "outputIndex",
            "baseName": "outputIndex",
            "type": "number"
        },
        {
            "name": "script",
            "baseName": "script",
            "type": "GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerScript"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerValue"
        },
        {
            "name": "witnesses",
            "baseName": "witnesses",
            "type": "Array<string>"
        }
    ];
    return GetTransactionDetailsByTransactionHashUTXOsRIInputsInner;
}());
exports.GetTransactionDetailsByTransactionHashUTXOsRIInputsInner = GetTransactionDetailsByTransactionHashUTXOsRIInputsInner;
//# sourceMappingURL=getTransactionDetailsByTransactionHashUTXOsRIInputsInner.js.map