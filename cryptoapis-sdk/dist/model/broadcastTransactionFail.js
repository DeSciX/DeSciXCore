"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastTransactionFail = void 0;
var BroadcastTransactionFail = (function () {
    function BroadcastTransactionFail() {
    }
    BroadcastTransactionFail.getAttributeTypeMap = function () {
        return BroadcastTransactionFail.attributeTypeMap;
    };
    BroadcastTransactionFail.discriminator = undefined;
    BroadcastTransactionFail.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "referenceId",
            "baseName": "referenceId",
            "type": "string"
        },
        {
            "name": "idempotencyKey",
            "baseName": "idempotencyKey",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "BroadcastTransactionFailData"
        }
    ];
    return BroadcastTransactionFail;
}());
exports.BroadcastTransactionFail = BroadcastTransactionFail;
//# sourceMappingURL=broadcastTransactionFail.js.map