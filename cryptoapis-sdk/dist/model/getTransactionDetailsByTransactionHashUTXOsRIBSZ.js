"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashUTXOsRIBSZ = void 0;
var GetTransactionDetailsByTransactionHashUTXOsRIBSZ = (function () {
    function GetTransactionDetailsByTransactionHashUTXOsRIBSZ() {
    }
    GetTransactionDetailsByTransactionHashUTXOsRIBSZ.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashUTXOsRIBSZ.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashUTXOsRIBSZ.discriminator = undefined;
    GetTransactionDetailsByTransactionHashUTXOsRIBSZ.attributeTypeMap = [
        {
            "name": "expiryHeight",
            "baseName": "expiryHeight",
            "type": "number"
        },
        {
            "name": "overwintered",
            "baseName": "overwintered",
            "type": "boolean"
        },
        {
            "name": "valueBalance",
            "baseName": "valueBalance",
            "type": "GetTransactionDetailsByTransactionHashUTXOsRIBSZValueBalance"
        },
        {
            "name": "versionGroupId",
            "baseName": "versionGroupId",
            "type": "string"
        }
    ];
    return GetTransactionDetailsByTransactionHashUTXOsRIBSZ;
}());
exports.GetTransactionDetailsByTransactionHashUTXOsRIBSZ = GetTransactionDetailsByTransactionHashUTXOsRIBSZ;
//# sourceMappingURL=getTransactionDetailsByTransactionHashUTXOsRIBSZ.js.map