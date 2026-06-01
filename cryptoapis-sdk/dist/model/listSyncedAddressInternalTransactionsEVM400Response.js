"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressInternalTransactionsEVM400Response = void 0;
var ListSyncedAddressInternalTransactionsEVM400Response = (function () {
    function ListSyncedAddressInternalTransactionsEVM400Response() {
    }
    ListSyncedAddressInternalTransactionsEVM400Response.getAttributeTypeMap = function () {
        return ListSyncedAddressInternalTransactionsEVM400Response.attributeTypeMap;
    };
    ListSyncedAddressInternalTransactionsEVM400Response.discriminator = undefined;
    ListSyncedAddressInternalTransactionsEVM400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "ListSyncedAddressInternalTransactionsEVME400"
        }
    ];
    return ListSyncedAddressInternalTransactionsEVM400Response;
}());
exports.ListSyncedAddressInternalTransactionsEVM400Response = ListSyncedAddressInternalTransactionsEVM400Response;
//# sourceMappingURL=listSyncedAddressInternalTransactionsEVM400Response.js.map