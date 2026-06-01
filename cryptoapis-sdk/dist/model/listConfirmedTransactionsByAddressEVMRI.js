"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMRI = void 0;
var ListConfirmedTransactionsByAddressEVMRI = (function () {
    function ListConfirmedTransactionsByAddressEVMRI() {
    }
    ListConfirmedTransactionsByAddressEVMRI.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMRI.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMRI.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMRI.attributeTypeMap = [
        {
            "name": "contract",
            "baseName": "contract",
            "type": "string"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListConfirmedTransactionsByAddressEVMRIFee"
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
            "name": "gasPrice",
            "baseName": "gasPrice",
            "type": "ListConfirmedTransactionsByAddressEVMRIGasPrice"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "ListConfirmedTransactionsByAddressEVMRIMinedInBlock"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListConfirmedTransactionsByAddressEVMRIValue"
        },
        {
            "name": "blockchainSpecific",
            "baseName": "blockchainSpecific",
            "type": "ListConfirmedTransactionsByAddressEVMRIBST"
        }
    ];
    return ListConfirmedTransactionsByAddressEVMRI;
}());
exports.ListConfirmedTransactionsByAddressEVMRI = ListConfirmedTransactionsByAddressEVMRI;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMRI.js.map