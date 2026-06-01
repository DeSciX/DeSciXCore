"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddresses400Response = void 0;
var ListSyncedAddresses400Response = (function () {
    function ListSyncedAddresses400Response() {
    }
    ListSyncedAddresses400Response.getAttributeTypeMap = function () {
        return ListSyncedAddresses400Response.attributeTypeMap;
    };
    ListSyncedAddresses400Response.discriminator = undefined;
    ListSyncedAddresses400Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressesE400"
        }
    ];
    return ListSyncedAddresses400Response;
}());
exports.ListSyncedAddresses400Response = ListSyncedAddresses400Response;
//# sourceMappingURL=listSyncedAddresses400Response.js.map