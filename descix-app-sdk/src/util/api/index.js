/**
 * Api - Composing facade for shell-level network calls
 *
 * Consolidates domain modules into a single Api class.
 * Does NOT include Powch-specific commands (those stay in PowchNetworkAPI).
 */

import { makeCommandRequestJSON } from '../AppData.jsx';
import * as ApiAuth from './ApiAuth.js';
import * as ApiCommunities from './ApiCommunities.js';
import * as ApiPayments from './ApiPayments.js';
import * as ApiContent from './ApiContent.js';

export class Api {
  static call = (command, params = {}, allowGuest = false) =>
    makeCommandRequestJSON(command, params, allowGuest);
}

Object.assign(Api, ApiAuth, ApiCommunities, ApiPayments, ApiContent);
