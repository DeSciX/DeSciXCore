"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSyncedEVMR = void 0;
var ListTokensByAddressSyncedEVMR = (function () {
    function ListTokensByAddressSyncedEVMR() {
    }
    ListTokensByAddressSyncedEVMR.getAttributeTypeMap = function () {
        return ListTokensByAddressSyncedEVMR.attributeTypeMap;
    };
    ListTokensByAddressSyncedEVMR.discriminator = undefined;
    ListTokensByAddressSyncedEVMR.attributeTypeMap = [
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
            "name": "data",
            "baseName": "data",
            "type": "ListTokensByAddressSyncedEVMRData"
        }
    ];
    return ListTokensByAddressSyncedEVMR;
}());
exports.ListTokensByAddressSyncedEVMR = ListTokensByAddressSyncedEVMR;
//# sourceMappingURL=listTokensByAddressSyncedEVMR.js.map