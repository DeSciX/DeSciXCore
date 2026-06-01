"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressTokensTransferEVMRI = void 0;
var ListSyncedAddressTokensTransferEVMRI = (function () {
    function ListSyncedAddressTokensTransferEVMRI() {
    }
    ListSyncedAddressTokensTransferEVMRI.getAttributeTypeMap = function () {
        return ListSyncedAddressTokensTransferEVMRI.attributeTypeMap;
    };
    ListSyncedAddressTokensTransferEVMRI.discriminator = undefined;
    ListSyncedAddressTokensTransferEVMRI.attributeTypeMap = [
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
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListSyncedAddressTokensTransferEVMRIFee"
        },
        {
            "name": "tokenData",
            "baseName": "tokenData",
            "type": "ListSyncedAddressTokensTransferEVMRITokenData"
        },
        {
            "name": "transactionHash",
            "baseName": "transactionHash",
            "type": "string"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "ListSyncedAddressTokensTransferEVMRIMinedInBlock"
        }
    ];
    return ListSyncedAddressTokensTransferEVMRI;
}());
exports.ListSyncedAddressTokensTransferEVMRI = ListSyncedAddressTokensTransferEVMRI;
//# sourceMappingURL=listSyncedAddressTokensTransferEVMRI.js.map