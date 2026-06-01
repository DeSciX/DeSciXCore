"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressUTXORI = void 0;
var ValidateAddressUTXORI = (function () {
    function ValidateAddressUTXORI() {
    }
    ValidateAddressUTXORI.getAttributeTypeMap = function () {
        return ValidateAddressUTXORI.attributeTypeMap;
    };
    ValidateAddressUTXORI.discriminator = undefined;
    ValidateAddressUTXORI.attributeTypeMap = [
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
    return ValidateAddressUTXORI;
}());
exports.ValidateAddressUTXORI = ValidateAddressUTXORI;
//# sourceMappingURL=validateAddressUTXORI.js.map