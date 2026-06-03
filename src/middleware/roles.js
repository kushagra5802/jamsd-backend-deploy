const AccessControl = require("accesscontrol");
const ac = new AccessControl();

exports.roles = (function() {
ac.grant("finance_team")

ac.grant("team_member")
  .readOwn("profile")
  .extend("finance_team")
  .updateOwn("profile")

ac.grant("manager")
  .extend("team_member")
  .readAny("profile")
  .createAny('profile')

ac.grant("management")
  .extend("team_member")
  .extend("manager")
  .updateAny("profile")
  .deleteAny("profile")

return ac;
})();