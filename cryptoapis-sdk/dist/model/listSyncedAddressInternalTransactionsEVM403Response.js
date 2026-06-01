"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressInternalTransactionsEVM403Response = void 0;
var ListSyncedAddressInternalTransactionsEVM403Response = (function () {
    function ListSyncedAddressInternalTransactionsEVM403Response() {
    }
    ListSyncedAddressInternalTransactionsEVM403Response.getAttributeTypeMap = function () {
        return ListSyncedAddressInternalTransactionsEVM403Response.attributeTypeMap;
    };
    ListSyncedAddressInternalTransactionsEVM403Response.discriminator = undefined;
    ListSyncedAddressInternalTransactionsEVM403Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressInternalTransactionsEVME403"
        }
    ];
    return ListSyncedAddressInternalTransactionsEVM403Response;
}());
exports.ListSyncedAddressInternalTransactionsEVM403Response = ListSyncedAddressInternalTransactionsEVM403Response;
//# sourceMappingURL=listSyncedAddressInternalTransactionsEVM403Response.js.map