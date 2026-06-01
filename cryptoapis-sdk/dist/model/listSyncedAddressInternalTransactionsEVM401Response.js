"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressInternalTransactionsEVM401Response = void 0;
var ListSyncedAddressInternalTransactionsEVM401Response = (function () {
    function ListSyncedAddressInternalTransactionsEVM401Response() {
    }
    ListSyncedAddressInternalTransactionsEVM401Response.getAttributeTypeMap = function () {
        return ListSyncedAddressInternalTransactionsEVM401Response.attributeTypeMap;
    };
    ListSyncedAddressInternalTransactionsEVM401Response.discriminator = undefined;
    ListSyncedAddressInternalTransactionsEVM401Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressInternalTransactionsEVME401"
        }
    ];
    return ListSyncedAddressInternalTransactionsEVM401Response;
}());
exports.ListSyncedAddressInternalTransactionsEVM401Response = ListSyncedAddressInternalTransactionsEVM401Response;
//# sourceMappingURL=listSyncedAddressInternalTransactionsEVM401Response.js.map