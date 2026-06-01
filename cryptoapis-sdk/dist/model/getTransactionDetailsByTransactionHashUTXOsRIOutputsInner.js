"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashUTXOsRIOutputsInner = void 0;
var GetTransactionDetailsByTransactionHashUTXOsRIOutputsInner = (function () {
    function GetTransactionDetailsByTransactionHashUTXOsRIOutputsInner() {
    }
    GetTransactionDetailsByTransactionHashUTXOsRIOutputsInner.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashUTXOsRIOutputsInner.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashUTXOsRIOutputsInner.discriminator = undefined;
    GetTransactionDetailsByTransactionHashUTXOsRIOutputsInner.attributeTypeMap = [
        {
            "name": "addresses",
            "baseName": "addresses",
            "type": "Array<string>"
        },
        {
            "name": "isSpent",
            "baseName": "isSpent",
            "type": "boolean"
        },
        {
            "name": "script",
            "baseName": "script",
            "type": "GetTransactionDetailsByTransactionHashUTXOsRIOutputsInnerScript"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerValue"
        }
    ];
    return GetTransactionDetailsByTransactionHashUTXOsRIOutputsInner;
}());
exports.GetTransactionDetailsByTransactionHashUTXOsRIOutputsInner = GetTransactionDetailsByTransactionHashUTXOsRIOutputsInner;
//# sourceMappingURL=getTransactionDetailsByTransactionHashUTXOsRIOutputsInner.js.map