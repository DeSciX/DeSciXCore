"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressTokensTransactionConfirmedEachConfirmationDataItem = void 0;
var AddressTokensTransactionConfirmedEachConfirmationDataItem = (function () {
    function AddressTokensTransactionConfirmedEachConfirmationDataItem() {
    }
    AddressTokensTransactionConfirmedEachConfirmationDataItem.getAttributeTypeMap = function () {
        return AddressTokensTransactionConfirmedEachConfirmationDataItem.attributeTypeMap;
    };
    AddressTokensTransactionConfirmedEachConfirmationDataItem.discriminator = undefined;
    AddressTokensTransactionConfirmedEachConfirmationDataItem.attributeTypeMap = [
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
            "name": "currentConfirmations",
            "baseName": "currentConfirmations",
            "type": "number"
        },
        {
            "name": "targetConfirmations",
            "baseName": "targetConfirmations",
            "type": "number"
        },
        {
            "name": "tokenType",
            "baseName": "tokenType",
            "type": "AddressTokensTransactionConfirmedEachConfirmationDataItem.TokenTypeEnum"
        },
        {
            "name": "token",
            "baseName": "token",
            "type": "AddressTokensTransactionConfirmedEachConfirmationToken"
        },
        {
            "name": "direction",
            "baseName": "direction",
            "type": "AddressTokensTransactionConfirmedEachConfirmationDataItem.DirectionEnum"
        }
    ];
    return AddressTokensTransactionConfirmedEachConfirmationDataItem;
}());
exports.AddressTokensTransactionConfirmedEachConfirmationDataItem = AddressTokensTransactionConfirmedEachConfirmationDataItem;
(function (AddressTokensTransactionConfirmedEachConfirmationDataItem) {
    var TokenTypeEnum;
    (function (TokenTypeEnum) {
        TokenTypeEnum[TokenTypeEnum["Erc20"] = 'ERC-20'] = "Erc20";
        TokenTypeEnum[TokenTypeEnum["Erc721"] = 'ERC-721'] = "Erc721";
        TokenTypeEnum[TokenTypeEnum["Omni"] = 'OMNI'] = "Omni";
        TokenTypeEnum[TokenTypeEnum["Bep20"] = 'BEP-20'] = "Bep20";
        TokenTypeEnum[TokenTypeEnum["Trc20"] = 'TRC-20'] = "Trc20";
        TokenTypeEnum[TokenTypeEnum["Trc721"] = 'TRC-721'] = "Trc721";
    })(TokenTypeEnum = AddressTokensTransactionConfirmedEachConfirmationDataItem.TokenTypeEnum || (AddressTokensTransactionConfirmedEachConfirmationDataItem.TokenTypeEnum = {}));
    var DirectionEnum;
    (function (DirectionEnum) {
        DirectionEnum[DirectionEnum["Incoming"] = 'incoming'] = "Incoming";
        DirectionEnum[DirectionEnum["Outgoing"] = 'outgoing'] = "Outgoing";
    })(DirectionEnum = AddressTokensTransactionConfirmedEachConfirmationDataItem.DirectionEnum || (AddressTokensTransactionConfirmedEachConfirmationDataItem.DirectionEnum = {}));
})(AddressTokensTransactionConfirmedEachConfirmationDataItem || (exports.AddressTokensTransactionConfirmedEachConfirmationDataItem = AddressTokensTransactionConfirmedEachConfirmationDataItem = {}));
//# sourceMappingURL=addressTokensTransactionConfirmedEachConfirmationDataItem.js.map