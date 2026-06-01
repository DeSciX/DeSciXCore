"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastLocallySignedTransaction409Response = void 0;
var BroadcastLocallySignedTransaction409Response = (function () {
    function BroadcastLocallySignedTransaction409Response() {
    }
    BroadcastLocallySignedTransaction409Response.getAttributeTypeMap = function () {
        return BroadcastLocallySignedTransaction409Response.attributeTypeMap;
    };
    BroadcastLocallySignedTransaction409Response.discriminator = undefined;
    BroadcastLocallySignedTransaction409Response.attributeTypeMap = [
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
            "type": "BroadcastLocallySignedTransactionE409"
        }
    ];
    return BroadcastLocallySignedTransaction409Response;
}());
exports.BroadcastLocallySignedTransaction409Response = BroadcastLocallySignedTransaction409Response;
//# sourceMappingURL=broadcastLocallySignedTransaction409Response.js.map