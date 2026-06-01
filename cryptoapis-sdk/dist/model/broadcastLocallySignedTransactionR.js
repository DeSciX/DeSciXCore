"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastLocallySignedTransactionR = void 0;
var BroadcastLocallySignedTransactionR = (function () {
    function BroadcastLocallySignedTransactionR() {
    }
    BroadcastLocallySignedTransactionR.getAttributeTypeMap = function () {
        return BroadcastLocallySignedTransactionR.attributeTypeMap;
    };
    BroadcastLocallySignedTransactionR.discriminator = undefined;
    BroadcastLocallySignedTransactionR.attributeTypeMap = [
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
            "type": "BroadcastLocallySignedTransactionRData"
        }
    ];
    return BroadcastLocallySignedTransactionR;
}());
exports.BroadcastLocallySignedTransactionR = BroadcastLocallySignedTransactionR;
//# sourceMappingURL=broadcastLocallySignedTransactionR.js.map