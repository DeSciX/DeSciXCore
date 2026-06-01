"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactionsAndEachConfirmationE400 = void 0;
var NewConfirmedTokensTransactionsAndEachConfirmationE400 = (function () {
    function NewConfirmedTokensTransactionsAndEachConfirmationE400() {
    }
    NewConfirmedTokensTransactionsAndEachConfirmationE400.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactionsAndEachConfirmationE400.attributeTypeMap;
    };
    NewConfirmedTokensTransactionsAndEachConfirmationE400.discriminator = undefined;
    NewConfirmedTokensTransactionsAndEachConfirmationE400.attributeTypeMap = [
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
    return NewConfirmedTokensTransactionsAndEachConfirmationE400;
}());
exports.NewConfirmedTokensTransactionsAndEachConfirmationE400 = NewConfirmedTokensTransactionsAndEachConfirmationE400;
//# sourceMappingURL=newConfirmedTokensTransactionsAndEachConfirmationE400.js.map