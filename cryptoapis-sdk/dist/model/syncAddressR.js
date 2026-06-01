"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddressR = void 0;
var SyncAddressR = (function () {
    function SyncAddressR() {
    }
    SyncAddressR.getAttributeTypeMap = function () {
        return SyncAddressR.attributeTypeMap;
    };
    SyncAddressR.discriminator = undefined;
    SyncAddressR.attributeTypeMap = [
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
            "type": "SyncAddressRData"
        }
    ];
    return SyncAddressR;
}());
exports.SyncAddressR = SyncAddressR;
//# sourceMappingURL=syncAddressR.js.map