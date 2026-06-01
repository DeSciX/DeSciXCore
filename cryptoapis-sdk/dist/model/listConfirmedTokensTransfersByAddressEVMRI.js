"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTokensTransfersByAddressEVMRI = void 0;
var ListConfirmedTokensTransfersByAddressEVMRI = (function () {
    function ListConfirmedTokensTransfersByAddressEVMRI() {
    }
    ListConfirmedTokensTransfersByAddressEVMRI.getAttributeTypeMap = function () {
        return ListConfirmedTokensTransfersByAddressEVMRI.attributeTypeMap;
    };
    ListConfirmedTokensTransfersByAddressEVMRI.discriminator = undefined;
    ListConfirmedTokensTransfersByAddressEVMRI.attributeTypeMap = [
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
            "type": "ListConfirmedTokensTransfersByAddressEVMRIFee"
        },
        {
            "name": "tokenData",
            "baseName": "tokenData",
            "type": "ListConfirmedTokensTransfersByAddressEVMRITokenData"
        },
        {
            "name": "transactionHash",
            "baseName": "transactionHash",
            "type": "string"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "ListConfirmedTokensTransfersByAddressEVMRIMinedInBlock"
        }
    ];
    return ListConfirmedTokensTransfersByAddressEVMRI;
}());
exports.ListConfirmedTokensTransfersByAddressEVMRI = ListConfirmedTokensTransfersByAddressEVMRI;
//# sourceMappingURL=listConfirmedTokensTransfersByAddressEVMRI.js.map