"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddress401Response = void 0;
var SyncAddress401Response = (function () {
    function SyncAddress401Response() {
    }
    SyncAddress401Response.getAttributeTypeMap = function () {
        return SyncAddress401Response.attributeTypeMap;
    };
    SyncAddress401Response.discriminator = undefined;
    SyncAddress401Response.attributeTypeMap = [
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
            "type": "SyncAddressE401"
        }
    ];
    return SyncAddress401Response;
}());
exports.SyncAddress401Response = SyncAddress401Response;
//# sourceMappingURL=syncAddress401Response.js.map