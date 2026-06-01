"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashEVMRI = void 0;
var GetTransactionDetailsByTransactionHashEVMRI = (function () {
    function GetTransactionDetailsByTransactionHashEVMRI() {
    }
    GetTransactionDetailsByTransactionHashEVMRI.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashEVMRI.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashEVMRI.discriminator = undefined;
    GetTransactionDetailsByTransactionHashEVMRI.attributeTypeMap = [
        {
            "name": "contract",
            "baseName": "contract",
            "type": "string"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "GetTransactionDetailsByTransactionHashEVMRIFee"
        },
        {
            "name": "gasLimit",
            "baseName": "gasLimit",
            "type": "number"
        },
        {
            "name": "gasUsed",
            "baseName": "gasUsed",
            "type": "number"
        },
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "inputData",
            "baseName": "inputData",
            "type": "string"
        },
        {
            "name": "nonce",
            "baseName": "nonce",
            "type": "number"
        },
        {
            "name": "positionInBlock",
            "baseName": "positionInBlock",
            "type": "number"
        },
        {
            "name": "recipient",
            "baseName": "recipient",
            "type": "string"
        },
        {
            "name": "sender",
            "baseName": "sender",
            "type": "string"
        },
        {
            "name": "status",
            "baseName": "status",
            "type": "string"
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "GetTransactionDetailsByTransactionHashEVMRIValue"
        },
        {
            "name": "gasPrice",
            "baseName": "gasPrice",
            "type": "GetTransactionDetailsByTransactionHashEVMRIGasPrice"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "GetTransactionDetailsByTransactionHashEVMRIMinedInBlock"
        },
        {
            "name": "blockchainSpecific",
            "baseName": "blockchainSpecific",
            "type": "GetTransactionDetailsByTransactionHashEVMRIBSE"
        }
    ];
    return GetTransactionDetailsByTransactionHashEVMRI;
}());
exports.GetTransactionDetailsByTransactionHashEVMRI = GetTransactionDetailsByTransactionHashEVMRI;
//# sourceMappingURL=getTransactionDetailsByTransactionHashEVMRI.js.map