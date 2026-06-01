"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressTokensTransferEVM401Response = void 0;
var ListSyncedAddressTokensTransferEVM401Response = (function () {
    function ListSyncedAddressTokensTransferEVM401Response() {
    }
    ListSyncedAddressTokensTransferEVM401Response.getAttributeTypeMap = function () {
        return ListSyncedAddressTokensTransferEVM401Response.attributeTypeMap;
    };
    ListSyncedAddressTokensTransferEVM401Response.discriminator = undefined;
    ListSyncedAddressTokensTransferEVM401Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressTokensTransferEVME401"
        }
    ];
    return ListSyncedAddressTokensTransferEVM401Response;
}());
exports.ListSyncedAddressTokensTransferEVM401Response = ListSyncedAddressTokensTransferEVM401Response;
//# sourceMappingURL=listSyncedAddressTokensTransferEVM401Response.js.map