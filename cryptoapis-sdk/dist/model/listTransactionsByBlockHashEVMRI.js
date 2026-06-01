"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashEVMRI = void 0;
var ListTransactionsByBlockHashEVMRI = (function () {
    function ListTransactionsByBlockHashEVMRI() {
    }
    ListTransactionsByBlockHashEVMRI.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashEVMRI.attributeTypeMap;
    };
    ListTransactionsByBlockHashEVMRI.discriminator = undefined;
    ListTransactionsByBlockHashEVMRI.attributeTypeMap = [
        {
            "name": "contract",
            "baseName": "contract",
            "type": "number"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListTransactionsByBlockHashEVMRIFee"
        },
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "inputData",
            "baseName": "inputData",
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
            "type": "ListTransactionsByBlockHashEVMRIValue"
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
            "name": "gasPrice",
            "baseName": "gasPrice",
            "type": "ListTransactionsByBlockHashEVMRIGasPrice"
        },
        {
            "name": "blockchainSpecific",
            "baseName": "blockchainSpecific",
            "type": "ListTransactionsByBlockHashEVMRIBlockchainSpecific"
        }
    ];
    return ListTransactionsByBlockHashEVMRI;
}());
exports.ListTransactionsByBlockHashEVMRI = ListTransactionsByBlockHashEVMRI;
//# sourceMappingURL=listTransactionsByBlockHashEVMRI.js.map