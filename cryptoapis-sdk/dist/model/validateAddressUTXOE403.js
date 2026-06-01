"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressUTXOE403 = void 0;
var ValidateAddressUTXOE403 = (function () {
    function ValidateAddressUTXOE403() {
    }
    ValidateAddressUTXOE403.getAttributeTypeMap = function () {
        return ValidateAddressUTXOE403.attributeTypeMap;
    };
    ValidateAddressUTXOE403.discriminator = undefined;
    ValidateAddressUTXOE403.attributeTypeMap = [
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
    return ValidateAddressUTXOE403;
}());
exports.ValidateAddressUTXOE403 = ValidateAddressUTXOE403;
//# sourceMappingURL=validateAddressUTXOE403.js.map