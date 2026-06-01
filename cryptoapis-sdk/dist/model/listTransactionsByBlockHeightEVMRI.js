"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightEVMRI = void 0;
var ListTransactionsByBlockHeightEVMRI = (function () {
    function ListTransactionsByBlockHeightEVMRI() {
    }
    ListTransactionsByBlockHeightEVMRI.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightEVMRI.attributeTypeMap;
    };
    ListTransactionsByBlockHeightEVMRI.discriminator = undefined;
    ListTransactionsByBlockHeightEVMRI.attributeTypeMap = [
        {
            "name": "contract",
            "baseName": "contract",
            "type": "string"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListTransactionsByBlockHeightEVMRIFee"
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
            "type": "ListTransactionsByBlockHeightEVMRIValue"
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
            "type": "ListTransactionsByBlockHeightEVMRIGasPrice"
        },
        {
            "name": "blockchainSpecific",
            "baseName": "blockchainSpecific",
            "type": "ListTransactionsByBlockHeightEVMRIBlockchainSpecific"
        }
    ];
    return ListTransactionsByBlockHeightEVMRI;
}());
exports.ListTransactionsByBlockHeightEVMRI = ListTransactionsByBlockHeightEVMRI;
//# sourceMappingURL=listTransactionsByBlockHeightEVMRI.js.map