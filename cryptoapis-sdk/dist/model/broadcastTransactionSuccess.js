"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastTransactionSuccess = void 0;
var BroadcastTransactionSuccess = (function () {
    function BroadcastTransactionSuccess() {
    }
    BroadcastTransactionSuccess.getAttributeTypeMap = function () {
        return BroadcastTransactionSuccess.attributeTypeMap;
    };
    BroadcastTransactionSuccess.discriminator = undefined;
    BroadcastTransactionSuccess.attributeTypeMap = [
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
            "type": "BroadcastTransactionSuccessData"
        }
    ];
    return BroadcastTransactionSuccess;
}());
exports.BroadcastTransactionSuccess = BroadcastTransactionSuccess;
//# sourceMappingURL=broadcastTransactionSuccess.js.map