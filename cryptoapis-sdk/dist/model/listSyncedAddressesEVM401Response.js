"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesEVM401Response = void 0;
var ListSyncedAddressesEVM401Response = (function () {
    function ListSyncedAddressesEVM401Response() {
    }
    ListSyncedAddressesEVM401Response.getAttributeTypeMap = function () {
        return ListSyncedAddressesEVM401Response.attributeTypeMap;
    };
    ListSyncedAddressesEVM401Response.discriminator = undefined;
    ListSyncedAddressesEVM401Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressesEVME401"
        }
    ];
    return ListSyncedAddressesEVM401Response;
}());
exports.ListSyncedAddressesEVM401Response = ListSyncedAddressesEVM401Response;
//# sourceMappingURL=listSyncedAddressesEVM401Response.js.map