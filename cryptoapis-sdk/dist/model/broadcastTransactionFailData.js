"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastTransactionFailData = void 0;
var BroadcastTransactionFailData = (function () {
    function BroadcastTransactionFailData() {
    }
    BroadcastTransactionFailData.getAttributeTypeMap = function () {
        return BroadcastTransactionFailData.attributeTypeMap;
    };
    BroadcastTransactionFailData.discriminator = undefined;
    BroadcastTransactionFailData.attributeTypeMap = [
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
            "type": "BroadcastTransactionFailDataItem"
        }
    ];
    return BroadcastTransactionFailData;
}());
exports.BroadcastTransactionFailData = BroadcastTransactionFailData;
//# sourceMappingURL=broadcastTransactionFailData.js.map