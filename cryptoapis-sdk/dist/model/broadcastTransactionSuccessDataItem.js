"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastTransactionSuccessDataItem = void 0;
var BroadcastTransactionSuccessDataItem = (function () {
    function BroadcastTransactionSuccessDataItem() {
    }
    BroadcastTransactionSuccessDataItem.getAttributeTypeMap = function () {
        return BroadcastTransactionSuccessDataItem.attributeTypeMap;
    };
    BroadcastTransactionSuccessDataItem.discriminator = undefined;
    BroadcastTransactionSuccessDataItem.attributeTypeMap = [
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
        }
    ];
    return BroadcastTransactionSuccessDataItem;
}());
exports.BroadcastTransactionSuccessDataItem = BroadcastTransactionSuccessDataItem;
//# sourceMappingURL=broadcastTransactionSuccessDataItem.js.map