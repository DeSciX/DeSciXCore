"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastLocallySignedTransaction400Response = void 0;
var BroadcastLocallySignedTransaction400Response = (function () {
    function BroadcastLocallySignedTransaction400Response() {
    }
    BroadcastLocallySignedTransaction400Response.getAttributeTypeMap = function () {
        return BroadcastLocallySignedTransaction400Response.attributeTypeMap;
    };
    BroadcastLocallySignedTransaction400Response.discriminator = undefined;
    BroadcastLocallySignedTransaction400Response.attributeTypeMap = [
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
            "type": "BroadcastLocallySignedTransactionE400"
        }
    ];
    return BroadcastLocallySignedTransaction400Response;
}());
exports.BroadcastLocallySignedTransaction400Response = BroadcastLocallySignedTransaction400Response;
//# sourceMappingURL=broadcastLocallySignedTransaction400Response.js.map