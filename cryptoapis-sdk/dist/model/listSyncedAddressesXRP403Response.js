"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesXRP403Response = void 0;
var ListSyncedAddressesXRP403Response = (function () {
    function ListSyncedAddressesXRP403Response() {
    }
    ListSyncedAddressesXRP403Response.getAttributeTypeMap = function () {
        return ListSyncedAddressesXRP403Response.attributeTypeMap;
    };
    ListSyncedAddressesXRP403Response.discriminator = undefined;
    ListSyncedAddressesXRP403Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressesXRPE403"
        }
    ];
    return ListSyncedAddressesXRP403Response;
}());
exports.ListSyncedAddressesXRP403Response = ListSyncedAddressesXRP403Response;
//# sourceMappingURL=listSyncedAddressesXRP403Response.js.map