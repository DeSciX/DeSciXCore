"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressTokensTransferEVMR = void 0;
var ListSyncedAddressTokensTransferEVMR = (function () {
    function ListSyncedAddressTokensTransferEVMR() {
    }
    ListSyncedAddressTokensTransferEVMR.getAttributeTypeMap = function () {
        return ListSyncedAddressTokensTransferEVMR.attributeTypeMap;
    };
    ListSyncedAddressTokensTransferEVMR.discriminator = undefined;
    ListSyncedAddressTokensTransferEVMR.attributeTypeMap = [
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
            "type": "ListSyncedAddressTokensTransferEVMRData"
        }
    ];
    return ListSyncedAddressTokensTransferEVMR;
}());
exports.ListSyncedAddressTokensTransferEVMR = ListSyncedAddressTokensTransferEVMR;
//# sourceMappingURL=listSyncedAddressTokensTransferEVMR.js.map