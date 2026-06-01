"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastLocallySignedTransactionRBDataItem = void 0;
var BroadcastLocallySignedTransactionRBDataItem = (function () {
    function BroadcastLocallySignedTransactionRBDataItem() {
    }
    BroadcastLocallySignedTransactionRBDataItem.getAttributeTypeMap = function () {
        return BroadcastLocallySignedTransactionRBDataItem.attributeTypeMap;
    };
    BroadcastLocallySignedTransactionRBDataItem.discriminator = undefined;
    BroadcastLocallySignedTransactionRBDataItem.attributeTypeMap = [
        {
            "name": "callbackSecretKey",
            "baseName": "callbackSecretKey",
            "type": "string"
        },
        {
            "name": "callbackUrl",
            "baseName": "callbackUrl",
            "type": "string"
        },
        {
            "name": "signedTransactionHex",
            "baseName": "signedTransactionHex",
            "type": "string"
        }
    ];
    return BroadcastLocallySignedTransactionRBDataItem;
}());
exports.BroadcastLocallySignedTransactionRBDataItem = BroadcastLocallySignedTransactionRBDataItem;
//# sourceMappingURL=broadcastLocallySignedTransactionRBDataItem.js.map