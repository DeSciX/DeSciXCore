"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressInternalTransactionsEVMR = void 0;
var ListSyncedAddressInternalTransactionsEVMR = (function () {
    function ListSyncedAddressInternalTransactionsEVMR() {
    }
    ListSyncedAddressInternalTransactionsEVMR.getAttributeTypeMap = function () {
        return ListSyncedAddressInternalTransactionsEVMR.attributeTypeMap;
    };
    ListSyncedAddressInternalTransactionsEVMR.discriminator = undefined;
    ListSyncedAddressInternalTransactionsEVMR.attributeTypeMap = [
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
            "type": "ListSyncedAddressInternalTransactionsEVMRData"
        }
    ];
    return ListSyncedAddressInternalTransactionsEVMR;
}());
exports.ListSyncedAddressInternalTransactionsEVMR = ListSyncedAddressInternalTransactionsEVMR;
//# sourceMappingURL=listSyncedAddressInternalTransactionsEVMR.js.map