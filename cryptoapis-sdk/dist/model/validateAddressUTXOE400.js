"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressUTXOE400 = void 0;
var ValidateAddressUTXOE400 = (function () {
    function ValidateAddressUTXOE400() {
    }
    ValidateAddressUTXOE400.getAttributeTypeMap = function () {
        return ValidateAddressUTXOE400.attributeTypeMap;
    };
    ValidateAddressUTXOE400.discriminator = undefined;
    ValidateAddressUTXOE400.attributeTypeMap = [
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
    return ValidateAddressUTXOE400;
}());
exports.ValidateAddressUTXOE400 = ValidateAddressUTXOE400;
//# sourceMappingURL=validateAddressUTXOE400.js.map