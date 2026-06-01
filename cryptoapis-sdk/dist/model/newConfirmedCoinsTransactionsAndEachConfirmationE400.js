"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsAndEachConfirmationE400 = void 0;
var NewConfirmedCoinsTransactionsAndEachConfirmationE400 = (function () {
    function NewConfirmedCoinsTransactionsAndEachConfirmationE400() {
    }
    NewConfirmedCoinsTransactionsAndEachConfirmationE400.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsAndEachConfirmationE400.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsAndEachConfirmationE400.discriminator = undefined;
    NewConfirmedCoinsTransactionsAndEachConfirmationE400.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return NewConfirmedCoinsTransactionsAndEachConfirmationE400;
}());
exports.NewConfirmedCoinsTransactionsAndEachConfirmationE400 = NewConfirmedCoinsTransactionsAndEachConfirmationE400;
//# sourceMappingURL=newConfirmedCoinsTransactionsAndEachConfirmationE400.js.map