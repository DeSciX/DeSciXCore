"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashUTXOsRIMinedInBlock = void 0;
var GetTransactionDetailsByTransactionHashUTXOsRIMinedInBlock = (function () {
    function GetTransactionDetailsByTransactionHashUTXOsRIMinedInBlock() {
    }
    GetTransactionDetailsByTransactionHashUTXOsRIMinedInBlock.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashUTXOsRIMinedInBlock.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashUTXOsRIMinedInBlock.discriminator = undefined;
    GetTransactionDetailsByTransactionHashUTXOsRIMinedInBlock.attributeTypeMap = [
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "height",
            "baseName": "height",
            "type": "number"
        }
    ];
    return GetTransactionDetailsByTransactionHashUTXOsRIMinedInBlock;
}());
exports.GetTransactionDetailsByTransactionHashUTXOsRIMinedInBlock = GetTransactionDetailsByTransactionHashUTXOsRIMinedInBlock;
//# sourceMappingURL=getTransactionDetailsByTransactionHashUTXOsRIMinedInBlock.js.map