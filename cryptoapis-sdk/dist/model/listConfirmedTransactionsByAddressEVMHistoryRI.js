"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMHistoryRI = void 0;
var ListConfirmedTransactionsByAddressEVMHistoryRI = (function () {
    function ListConfirmedTransactionsByAddressEVMHistoryRI() {
    }
    ListConfirmedTransactionsByAddressEVMHistoryRI.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMHistoryRI.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMHistoryRI.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMHistoryRI.attributeTypeMap = [
        {
            "name": "contract",
            "baseName": "contract",
            "type": "string"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListConfirmedTransactionsByAddressEVMHistoryRIFee"
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
            "name": "value",
            "baseName": "value",
            "type": "ListConfirmedTransactionsByAddressEVMHistoryRIValue"
        },
        {
            "name": "gasPrice",
            "baseName": "gasPrice",
            "type": "ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIGasPrice"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIMinedInBlock"
        },
        {
            "name": "vallue",
            "baseName": "vallue",
            "type": "object"
        },
        {
            "name": "blockchainSpecific",
            "baseName": "blockchainSpecific",
            "type": "ListConfirmedTransactionsByAddressEVMHistoryRIBST"
        }
    ];
    return ListConfirmedTransactionsByAddressEVMHistoryRI;
}());
exports.ListConfirmedTransactionsByAddressEVMHistoryRI = ListConfirmedTransactionsByAddressEVMHistoryRI;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMHistoryRI.js.map