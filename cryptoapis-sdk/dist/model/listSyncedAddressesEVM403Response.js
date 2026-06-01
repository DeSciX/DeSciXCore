"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesEVM403Response = void 0;
var ListSyncedAddressesEVM403Response = (function () {
    function ListSyncedAddressesEVM403Response() {
    }
    ListSyncedAddressesEVM403Response.getAttributeTypeMap = function () {
        return ListSyncedAddressesEVM403Response.attributeTypeMap;
    };
    ListSyncedAddressesEVM403Response.discriminator = undefined;
    ListSyncedAddressesEVM403Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressesEVME403"
        }
    ];
    return ListSyncedAddressesEVM403Response;
}());
exports.ListSyncedAddressesEVM403Response = ListSyncedAddressesEVM403Response;
//# sourceMappingURL=listSyncedAddressesEVM403Response.js.map