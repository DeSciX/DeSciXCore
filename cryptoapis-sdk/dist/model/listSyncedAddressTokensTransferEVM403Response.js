"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressTokensTransferEVM403Response = void 0;
var ListSyncedAddressTokensTransferEVM403Response = (function () {
    function ListSyncedAddressTokensTransferEVM403Response() {
    }
    ListSyncedAddressTokensTransferEVM403Response.getAttributeTypeMap = function () {
        return ListSyncedAddressTokensTransferEVM403Response.attributeTypeMap;
    };
    ListSyncedAddressTokensTransferEVM403Response.discriminator = undefined;
    ListSyncedAddressTokensTransferEVM403Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressTokensTransferEVME403"
        }
    ];
    return ListSyncedAddressTokensTransferEVM403Response;
}());
exports.ListSyncedAddressTokensTransferEVM403Response = ListSyncedAddressTokensTransferEVM403Response;
//# sourceMappingURL=listSyncedAddressTokensTransferEVM403Response.js.map