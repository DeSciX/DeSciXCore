"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddress403Response = void 0;
var SyncAddress403Response = (function () {
    function SyncAddress403Response() {
    }
    SyncAddress403Response.getAttributeTypeMap = function () {
        return SyncAddress403Response.attributeTypeMap;
    };
    SyncAddress403Response.discriminator = undefined;
    SyncAddress403Response.attributeTypeMap = [
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
            "type": "SyncAddressE403"
        }
    ];
    return SyncAddress403Response;
}());
exports.SyncAddress403Response = SyncAddress403Response;
//# sourceMappingURL=syncAddress403Response.js.map