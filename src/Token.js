/*
 * This is an example Objection model for managing tokens
 *
 * For this to work with NodeEsi you must have:
 * - isExpired function: returns true if token needs to be refreshed
 * - refresh function: return self after refreshing token
 * - access_token property: returns the current access bearer token
 * - character_id property: returns the character_id of the token
 *
 * If you have all of the above you can swap in another model to suit your schema
 */

const { Model } = require("objection");
const axios = require("axios");

class Token extends Model {
  static tableName = "tokens";

  isExpired() {
    return this.expires < new Date();
  }

  async refresh() {
    try {
      const r = await axios.post(
        process.env.SSO_TOKEN_URI,
        { grant_type: "refresh_token", refresh_token: this.refresh_token },
        {
          auth: {
            username: process.env.SSO_CLIENT_ID,
            password: process.env.SSO_SECRET
          }
        }
      );

      this.access_token = r.data.access_token;
      this.refresh_token = r.data.refresh_token;
      await this.verify();
      return this;
    } catch (err) {
      if (err.response.status === 400) {
        await this.$query().patch({ deleted_at: new Date() });
        throw "Token revoked";
      } else {
        throw "Token refresh failed...";
      }
    }
  }

  async verify() {
    const r = await axios.get(process.env.SSO_VERIFY_URI, {
      headers: {
        authorization: "Bearer " + this.access_token
      }
    });
    this.character_id = r.data.CharacterID;
    this.character_name = r.data.CharacterName;
    this.token_type = r.data.TokenType;
    this.character_owner_hash = r.data.CharacterOwnerHash;
    this.expires = new Date(Date.parse(r.data.ExpiresOn));
    this.updated_at = new Date();
    await this.$query().patch(this);
    return this;
  }
}

module.exports = Token;
