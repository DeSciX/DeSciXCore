"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressUTXOR = void 0;
var ValidateAddressUTXOR = (function () {
    function ValidateAddressUTXOR() {
    }
    ValidateAddressUTXOR.getAttributeTypeMap = function () {
        return ValidateAddressUTXOR.attributeTypeMap;
    };
    ValidateAddressUTXOR.discriminator = undefined;
    ValidateAddressUTXOR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "ValidateAddressUTXORData"
        }
    ];
    return ValidateAddressUTXOR;
}());
exports.ValidateAddressUTXOR = ValidateAddressUTXOR;
//# sourceMappingURL=validateAddressUTXOR.js.map