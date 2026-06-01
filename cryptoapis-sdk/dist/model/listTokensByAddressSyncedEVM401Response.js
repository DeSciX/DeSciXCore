"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSyncedEVM401Response = void 0;
var ListTokensByAddressSyncedEVM401Response = (function () {
    function ListTokensByAddressSyncedEVM401Response() {
    }
    ListTokensByAddressSyncedEVM401Response.getAttributeTypeMap = function () {
        return ListTokensByAddressSyncedEVM401Response.attributeTypeMap;
    };
    ListTokensByAddressSyncedEVM401Response.discriminator = undefined;
    ListTokensByAddressSyncedEVM401Response.attributeTypeMap = [
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
            "type": "ListTokensByAddressSyncedEVME401"
        }
    ];
    return ListTokensByAddressSyncedEVM401Response;
}());
exports.ListTokensByAddressSyncedEVM401Response = ListTokensByAddressSyncedEVM401Response;
//# sourceMappingURL=listTokensByAddressSyncedEVM401Response.js.map