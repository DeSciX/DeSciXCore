"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KaspaAddressCoinsTransactionConfirmedDataItem = void 0;
var KaspaAddressCoinsTransactionConfirmedDataItem = (function () {
    function KaspaAddressCoinsTransactionConfirmedDataItem() {
    }
    KaspaAddressCoinsTransactionConfirmedDataItem.getAttributeTypeMap = function () {
        return KaspaAddressCoinsTransactionConfirmedDataItem.attributeTypeMap;
    };
    KaspaAddressCoinsTransactionConfirmedDataItem.discriminator = undefined;
    KaspaAddressCoinsTransactionConfirmedDataItem.attributeTypeMap = [
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
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "KaspaAddressCoinsTransactionConfirmedDataItemMinedInBlock"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        },
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        },
        {
            "name": "direction",
            "baseName": "direction",
            "type": "KaspaAddressCoinsTransactionConfirmedDataItem.DirectionEnum"
        }
    ];
    return KaspaAddressCoinsTransactionConfirmedDataItem;
}());
exports.KaspaAddressCoinsTransactionConfirmedDataItem = KaspaAddressCoinsTransactionConfirmedDataItem;
(function (KaspaAddressCoinsTransactionConfirmedDataItem) {
    var DirectionEnum;
    (function (DirectionEnum) {
        DirectionEnum[DirectionEnum["Incoming"] = 'incoming'] = "Incoming";
        DirectionEnum[DirectionEnum["Outgoing"] = 'outgoing'] = "Outgoing";
    })(DirectionEnum = KaspaAddressCoinsTransactionConfirmedDataItem.DirectionEnum || (KaspaAddressCoinsTransactionConfirmedDataItem.DirectionEnum = {}));
})(KaspaAddressCoinsTransactionConfirmedDataItem || (exports.KaspaAddressCoinsTransactionConfirmedDataItem = KaspaAddressCoinsTransactionConfirmedDataItem = {}));
//# sourceMappingURL=kaspaAddressCoinsTransactionConfirmedDataItem.js.map