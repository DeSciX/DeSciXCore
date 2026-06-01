"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastLocallySignedTransactionRB = void 0;
var BroadcastLocallySignedTransactionRB = (function () {
    function BroadcastLocallySignedTransactionRB() {
    }
    BroadcastLocallySignedTransactionRB.getAttributeTypeMap = function () {
        return BroadcastLocallySignedTransactionRB.attributeTypeMap;
    };
    BroadcastLocallySignedTransactionRB.discriminator = undefined;
    BroadcastLocallySignedTransactionRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "BroadcastLocallySignedTransactionRBData"
        }
    ];
    return BroadcastLocallySignedTransactionRB;
}());
exports.BroadcastLocallySignedTransactionRB = BroadcastLocallySignedTransactionRB;
//# sourceMappingURL=broadcastLocallySignedTransactionRB.js.map