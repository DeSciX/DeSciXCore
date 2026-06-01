"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddress400Response = void 0;
var SyncAddress400Response = (function () {
    function SyncAddress400Response() {
    }
    SyncAddress400Response.getAttributeTypeMap = function () {
        return SyncAddress400Response.attributeTypeMap;
    };
    SyncAddress400Response.discriminator = undefined;
    SyncAddress400Response.attributeTypeMap = [
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
            "type": "SyncAddressE400"
        }
    ];
    return SyncAddress400Response;
}());
exports.SyncAddress400Response = SyncAddress400Response;
//# sourceMappingURL=syncAddress400Response.js.map