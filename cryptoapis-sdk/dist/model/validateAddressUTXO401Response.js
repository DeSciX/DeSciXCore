"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressUTXO401Response = void 0;
var ValidateAddressUTXO401Response = (function () {
    function ValidateAddressUTXO401Response() {
    }
    ValidateAddressUTXO401Response.getAttributeTypeMap = function () {
        return ValidateAddressUTXO401Response.attributeTypeMap;
    };
    ValidateAddressUTXO401Response.discriminator = undefined;
    ValidateAddressUTXO401Response.attributeTypeMap = [
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
            "type": "ValidateAddressUTXOE401"
        }
    ];
    return ValidateAddressUTXO401Response;
}());
exports.ValidateAddressUTXO401Response = ValidateAddressUTXO401Response;
//# sourceMappingURL=validateAddressUTXO401Response.js.map