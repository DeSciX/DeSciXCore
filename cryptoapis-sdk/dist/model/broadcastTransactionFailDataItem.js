"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastTransactionFailDataItem = void 0;
var BroadcastTransactionFailDataItem = (function () {
    function BroadcastTransactionFailDataItem() {
    }
    BroadcastTransactionFailDataItem.getAttributeTypeMap = function () {
        return BroadcastTransactionFailDataItem.attributeTypeMap;
    };
    BroadcastTransactionFailDataItem.discriminator = undefined;
    BroadcastTransactionFailDataItem.attributeTypeMap = [
        {
            "name": "blockchain",
            "baseName": "blockchain",
            "type": "string"
        },
        {
            "name": "network",
            "baseName": "network",
            "type": "string"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        },
        {
            "name": "errorMessage",
            "baseName": "errorMessage",
            "type": "string"
        }
    ];
    return BroadcastTransactionFailDataItem;
}());
exports.BroadcastTransactionFailDataItem = BroadcastTransactionFailDataItem;
//# sourceMappingURL=broadcastTransactionFailDataItem.js.map