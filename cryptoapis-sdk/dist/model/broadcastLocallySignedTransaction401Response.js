"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastLocallySignedTransaction401Response = void 0;
var BroadcastLocallySignedTransaction401Response = (function () {
    function BroadcastLocallySignedTransaction401Response() {
    }
    BroadcastLocallySignedTransaction401Response.getAttributeTypeMap = function () {
        return BroadcastLocallySignedTransaction401Response.attributeTypeMap;
    };
    BroadcastLocallySignedTransaction401Response.discriminator = undefined;
    BroadcastLocallySignedTransaction401Response.attributeTypeMap = [
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
            "type": "BroadcastLocallySignedTransactionE401"
        }
    ];
    return BroadcastLocallySignedTransaction401Response;
}());
exports.BroadcastLocallySignedTransaction401Response = BroadcastLocallySignedTransaction401Response;
//# sourceMappingURL=broadcastLocallySignedTransaction401Response.js.map