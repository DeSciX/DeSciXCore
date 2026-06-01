"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressTokensTransactionConfirmedDataItem = void 0;
var AddressTokensTransactionConfirmedDataItem = (function () {
    function AddressTokensTransactionConfirmedDataItem() {
    }
    AddressTokensTransactionConfirmedDataItem.getAttributeTypeMap = function () {
        return AddressTokensTransactionConfirmedDataItem.attributeTypeMap;
    };
    AddressTokensTransactionConfirmedDataItem.discriminator = undefined;
    AddressTokensTransactionConfirmedDataItem.attributeTypeMap = [
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
            "type": "AddressTokensTransactionConfirmedDataItemMinedInBlock"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        },
        {
            "name": "tokenType",
            "baseName": "tokenType",
            "type": "AddressTokensTransactionConfirmedDataItem.TokenTypeEnum"
        },
        {
            "name": "token",
            "baseName": "token",
            "type": "AddressTokensTransactionConfirmedToken"
        },
        {
            "name": "direction",
            "baseName": "direction",
            "type": "AddressTokensTransactionConfirmedDataItem.DirectionEnum"
        }
    ];
    return AddressTokensTransactionConfirmedDataItem;
}());
exports.AddressTokensTransactionConfirmedDataItem = AddressTokensTransactionConfirmedDataItem;
(function (AddressTokensTransactionConfirmedDataItem) {
    var TokenTypeEnum;
    (function (TokenTypeEnum) {
        TokenTypeEnum[TokenTypeEnum["Erc20"] = 'ERC-20'] = "Erc20";
        TokenTypeEnum[TokenTypeEnum["Erc721"] = 'ERC-721'] = "Erc721";
        TokenTypeEnum[TokenTypeEnum["Omni"] = 'OMNI'] = "Omni";
        TokenTypeEnum[TokenTypeEnum["Bep20"] = 'BEP-20'] = "Bep20";
        TokenTypeEnum[TokenTypeEnum["Trc20"] = 'TRC-20'] = "Trc20";
        TokenTypeEnum[TokenTypeEnum["Trc721"] = 'TRC-721'] = "Trc721";
    })(TokenTypeEnum = AddressTokensTransactionConfirmedDataItem.TokenTypeEnum || (AddressTokensTransactionConfirmedDataItem.TokenTypeEnum = {}));
    var DirectionEnum;
    (function (DirectionEnum) {
        DirectionEnum[DirectionEnum["Incoming"] = 'incoming'] = "Incoming";
        DirectionEnum[DirectionEnum["Outgoing"] = 'outgoing'] = "Outgoing";
    })(DirectionEnum = AddressTokensTransactionConfirmedDataItem.DirectionEnum || (AddressTokensTransactionConfirmedDataItem.DirectionEnum = {}));
})(AddressTokensTransactionConfirmedDataItem || (exports.AddressTokensTransactionConfirmedDataItem = AddressTokensTransactionConfirmedDataItem = {}));
//# sourceMappingURL=addressTokensTransactionConfirmedDataItem.js.map