"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInner = void 0;
var GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInner = (function () {
    function GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInner() {
    }
    GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInner.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInner.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInner.discriminator = undefined;
    GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInner.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInnerValue"
        },
        {
            "name": "addresses",
            "baseName": "addresses",
            "type": "string"
        }
    ];
    return GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInner;
}());
exports.GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInner = GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInner;
//# sourceMappingURL=getTransactionDetailsByTransactionHashUTXOsRIRecipientsInner.js.map