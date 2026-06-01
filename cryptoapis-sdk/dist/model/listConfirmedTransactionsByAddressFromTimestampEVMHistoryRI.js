"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRI = void 0;
var ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRI = (function () {
    function ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRI() {
    }
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRI.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRI.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRI.discriminator = undefined;
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRI.attributeTypeMap = [
        {
            "name": "contract",
            "baseName": "contract",
            "type": "string"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIFee"
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
            "type": "ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIValue"
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
        }
    ];
    return ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRI;
}());
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRI = ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRI;
//# sourceMappingURL=listConfirmedTransactionsByAddressFromTimestampEVMHistoryRI.js.map