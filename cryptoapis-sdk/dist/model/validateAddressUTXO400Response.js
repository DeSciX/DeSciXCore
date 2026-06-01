"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressUTXO400Response = void 0;
var ValidateAddressUTXO400Response = (function () {
    function ValidateAddressUTXO400Response() {
    }
    ValidateAddressUTXO400Response.getAttributeTypeMap = function () {
        return ValidateAddressUTXO400Response.attributeTypeMap;
    };
    ValidateAddressUTXO400Response.discriminator = undefined;
    ValidateAddressUTXO400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "ValidateAddressUTXOE400"
        }
    ];
    return ValidateAddressUTXO400Response;
}());
exports.ValidateAddressUTXO400Response = ValidateAddressUTXO400Response;
//# sourceMappingURL=validateAddressUTXO400Response.js.map