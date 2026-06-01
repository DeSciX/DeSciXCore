"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressUTXOE401 = void 0;
var ValidateAddressUTXOE401 = (function () {
    function ValidateAddressUTXOE401() {
    }
    ValidateAddressUTXOE401.getAttributeTypeMap = function () {
        return ValidateAddressUTXOE401.attributeTypeMap;
    };
    ValidateAddressUTXOE401.discriminator = undefined;
    ValidateAddressUTXOE401.attributeTypeMap = [
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
    return ValidateAddressUTXOE401;
}());
exports.ValidateAddressUTXOE401 = ValidateAddressUTXOE401;
//# sourceMappingURL=validateAddressUTXOE401.js.map