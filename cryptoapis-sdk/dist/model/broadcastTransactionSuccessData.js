"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastTransactionSuccessData = void 0;
var BroadcastTransactionSuccessData = (function () {
    function BroadcastTransactionSuccessData() {
    }
    BroadcastTransactionSuccessData.getAttributeTypeMap = function () {
        return BroadcastTransactionSuccessData.attributeTypeMap;
    };
    BroadcastTransactionSuccessData.discriminator = undefined;
    BroadcastTransactionSuccessData.attributeTypeMap = [
        {
            "name": "product",
            "baseName": "product",
            "type": "string"
        },
        {
            "name": "event",
            "baseName": "event",
            "type": "string"
        },
        {
            "name": "item",
            "baseName": "item",
            "type": "BroadcastTransactionSuccessDataItem"
        }
    ];
    return BroadcastTransactionSuccessData;
}());
exports.BroadcastTransactionSuccessData = BroadcastTransactionSuccessData;
//# sourceMappingURL=broadcastTransactionSuccessData.js.map