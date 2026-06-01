"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddressRI = void 0;
var SyncAddressRI = (function () {
    function SyncAddressRI() {
    }
    SyncAddressRI.getAttributeTypeMap = function () {
        return SyncAddressRI.attributeTypeMap;
    };
    SyncAddressRI.discriminator = undefined;
    SyncAddressRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "blockchain",
            "baseName": "blockchain",
            "type": "string"
        },
        {
            "name": "callcackUrl",
            "baseName": "callcackUrl",
            "type": "string"
        },
        {
            "name": "isActive",
            "baseName": "isActive",
            "type": "boolean"
        },
        {
            "name": "network",
            "baseName": "network",
            "type": "string"
        },
        {
            "name": "syncStatus",
            "baseName": "syncStatus",
            "type": "string"
        }
    ];
    return SyncAddressRI;
}());
exports.SyncAddressRI = SyncAddressRI;
//# sourceMappingURL=syncAddressRI.js.map