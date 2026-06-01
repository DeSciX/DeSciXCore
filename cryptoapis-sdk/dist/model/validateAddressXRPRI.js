"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressXRPRI = void 0;
var ValidateAddressXRPRI = (function () {
    function ValidateAddressXRPRI() {
    }
    ValidateAddressXRPRI.getAttributeTypeMap = function () {
        return ValidateAddressXRPRI.attributeTypeMap;
    };
    ValidateAddressXRPRI.discriminator = undefined;
    ValidateAddressXRPRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "isValid",
            "baseName": "isValid",
            "type": "boolean"
        }
    ];
    return ValidateAddressXRPRI;
}());
exports.ValidateAddressXRPRI = ValidateAddressXRPRI;
//# sourceMappingURL=validateAddressXRPRI.js.map