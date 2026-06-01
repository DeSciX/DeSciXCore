"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashEVMRIMinedInBlock = void 0;
var GetTransactionDetailsByTransactionHashEVMRIMinedInBlock = (function () {
    function GetTransactionDetailsByTransactionHashEVMRIMinedInBlock() {
    }
    GetTransactionDetailsByTransactionHashEVMRIMinedInBlock.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashEVMRIMinedInBlock.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashEVMRIMinedInBlock.discriminator = undefined;
    GetTransactionDetailsByTransactionHashEVMRIMinedInBlock.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionHashEVMRIMinedInBlock;
}());
exports.GetTransactionDetailsByTransactionHashEVMRIMinedInBlock = GetTransactionDetailsByTransactionHashEVMRIMinedInBlock;
//# sourceMappingURL=getTransactionDetailsByTransactionHashEVMRIMinedInBlock.js.map