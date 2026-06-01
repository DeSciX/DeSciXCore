"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesXRP400Response = void 0;
var ListSyncedAddressesXRP400Response = (function () {
    function ListSyncedAddressesXRP400Response() {
    }
    ListSyncedAddressesXRP400Response.getAttributeTypeMap = function () {
        return ListSyncedAddressesXRP400Response.attributeTypeMap;
    };
    ListSyncedAddressesXRP400Response.discriminator = undefined;
    ListSyncedAddressesXRP400Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressesXRPE400"
        }
    ];
    return ListSyncedAddressesXRP400Response;
}());
exports.ListSyncedAddressesXRP400Response = ListSyncedAddressesXRP400Response;
//# sourceMappingURL=listSyncedAddressesXRP400Response.js.map