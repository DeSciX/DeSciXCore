"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastLocallySignedTransaction403Response = void 0;
var BroadcastLocallySignedTransaction403Response = (function () {
    function BroadcastLocallySignedTransaction403Response() {
    }
    BroadcastLocallySignedTransaction403Response.getAttributeTypeMap = function () {
        return BroadcastLocallySignedTransaction403Response.attributeTypeMap;
    };
    BroadcastLocallySignedTransaction403Response.discriminator = undefined;
    BroadcastLocallySignedTransaction403Response.attributeTypeMap = [
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
            "type": "BroadcastLocallySignedTransactionE403"
        }
    ];
    return BroadcastLocallySignedTransaction403Response;
}());
exports.BroadcastLocallySignedTransaction403Response = BroadcastLocallySignedTransaction403Response;
//# sourceMappingURL=broadcastLocallySignedTransaction403Response.js.map