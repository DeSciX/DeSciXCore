"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressXRPRB = void 0;
var ValidateAddressXRPRB = (function () {
    function ValidateAddressXRPRB() {
    }
    ValidateAddressXRPRB.getAttributeTypeMap = function () {
        return ValidateAddressXRPRB.attributeTypeMap;
    };
    ValidateAddressXRPRB.discriminator = undefined;
    ValidateAddressXRPRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "ValidateAddressXRPRBData"
        }
    ];
    return ValidateAddressXRPRB;
}());
exports.ValidateAddressXRPRB = ValidateAddressXRPRB;
//# sourceMappingURL=validateAddressXRPRB.js.map