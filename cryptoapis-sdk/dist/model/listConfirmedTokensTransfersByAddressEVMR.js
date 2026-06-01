"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTokensTransfersByAddressEVMR = void 0;
var ListConfirmedTokensTransfersByAddressEVMR = (function () {
    function ListConfirmedTokensTransfersByAddressEVMR() {
    }
    ListConfirmedTokensTransfersByAddressEVMR.getAttributeTypeMap = function () {
        return ListConfirmedTokensTransfersByAddressEVMR.attributeTypeMap;
    };
    ListConfirmedTokensTransfersByAddressEVMR.discriminator = undefined;
    ListConfirmedTokensTransfersByAddressEVMR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "ListConfirmedTokensTransfersByAddressEVMRData"
        }
    ];
    return ListConfirmedTokensTransfersByAddressEVMR;
}());
exports.ListConfirmedTokensTransfersByAddressEVMR = ListConfirmedTokensTransfersByAddressEVMR;
//# sourceMappingURL=listConfirmedTokensTransfersByAddressEVMR.js.map