const { Model } = require("objection");
const Token = require('./Token')

class TokenScope extends Model {
  static tableName = "token_scopes";

  static relationMappings = {
    token: {
      relation: Model.BelongsToOneRelation,
      modelClass: Token,
      join: {
        from: 'token_scopes.token_id',
        to: 'tokens.id'
      }
    }
  };
}

module.exports = TokenScope