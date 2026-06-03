const { Unauthorized } = require("http-errors");

class GetLayeredAccess {

    static getReportsToByRole(role) {
        try {
            // chief_of_staff can only reports to client
            if(role === "chief_of_staff") {
                return [
                    "client",
                ];
            } else if (role === "constituency_manager") {
                // constituency_manager can reports to client and chief_of_staff
                return [
                    "client",
                    "chief_of_staff",
                ];
            } else if (role === "office_manager") {
                // office_manager / data_entry_operator / cadre can reports to client, chief_of_staff or constituency_manager
                return [
                    "client",
                    "chief_of_staff",
                    "constituency_manager",
                ];
            } else if (role === "data_entry_operator" || role === "cadre") {
                // office_manager / data_entry_operator / cadre can reports to client, chief_of_staff or constituency_manager
                return [
                    "client",
                    "chief_of_staff",
                    "constituency_manager",
                    "office_manager"
                ];
            } 
            return []
        } catch (error) {
            throw Unauthorized(error);
        }
    };
}

module.exports = GetLayeredAccess;