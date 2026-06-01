"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsE400 = void 0;
var NewConfirmedInternalTransactionsE400 = (function () {
    function NewConfirmedInternalTransactionsE400() {
    }
    NewConfirmedInternalTransactionsE400.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsE400.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsE400.discriminator = undefined;
    NewConfirmedInternalTransactionsE400.attributeTypeMap = [
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
    return NewConfirmedInternalTransactionsE400;
}());
exports.NewConfirmedInternalTransactionsE400 = NewConfirmedInternalTransactionsE400;
//# sourceMappingURL=newConfirmedInternalTransactionsE400.js.map