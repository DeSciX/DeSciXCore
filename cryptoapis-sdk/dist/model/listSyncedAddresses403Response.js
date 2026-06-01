"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddresses403Response = void 0;
var ListSyncedAddresses403Response = (function () {
    function ListSyncedAddresses403Response() {
    }
    ListSyncedAddresses403Response.getAttributeTypeMap = function () {
        return ListSyncedAddresses403Response.attributeTypeMap;
    };
    ListSyncedAddresses403Response.discriminator = undefined;
    ListSyncedAddresses403Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressesE403"
        }
    ];
    return ListSyncedAddresses403Response;
}());
exports.ListSyncedAddresses403Response = ListSyncedAddresses403Response;
//# sourceMappingURL=listSyncedAddresses403Response.js.map