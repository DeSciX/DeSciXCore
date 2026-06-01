"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddress409Response = void 0;
var SyncAddress409Response = (function () {
    function SyncAddress409Response() {
    }
    SyncAddress409Response.getAttributeTypeMap = function () {
        return SyncAddress409Response.attributeTypeMap;
    };
    SyncAddress409Response.discriminator = undefined;
    SyncAddress409Response.attributeTypeMap = [
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
            "type": "SyncAddressE409"
        }
    ];
    return SyncAddress409Response;
}());
exports.SyncAddress409Response = SyncAddress409Response;
//# sourceMappingURL=syncAddress409Response.js.map