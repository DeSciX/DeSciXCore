"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressTokensTransferEVM400Response = void 0;
var ListSyncedAddressTokensTransferEVM400Response = (function () {
    function ListSyncedAddressTokensTransferEVM400Response() {
    }
    ListSyncedAddressTokensTransferEVM400Response.getAttributeTypeMap = function () {
        return ListSyncedAddressTokensTransferEVM400Response.attributeTypeMap;
    };
    ListSyncedAddressTokensTransferEVM400Response.discriminator = undefined;
    ListSyncedAddressTokensTransferEVM400Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressTokensTransferEVME400"
        }
    ];
    return ListSyncedAddressTokensTransferEVM400Response;
}());
exports.ListSyncedAddressTokensTransferEVM400Response = ListSyncedAddressTokensTransferEVM400Response;
//# sourceMappingURL=listSyncedAddressTokensTransferEVM400Response.js.map