const ClientUser = require("../modules/client/clientUser.model");

const getReportingIds = async (id) => {
    try {
        // console.log("Reports to Id",id)
        const array = await ClientUser.find({
            reportsTo: { $eq: id }
        });
        // console.log("Reports to array:",array)
        const ids = [];
        for (const item of array) {
            if (item.role !== 'office_manager') {
                ids.push(...await getReportingIds(item._id));
            } else if (item.role !== 'constituency_manager') {
                ids.push(...await getReportingIds(item._id));
            }
            // if (item.role !== 'office_manager' && item.role !== 'constituency_manager') {
            //     ids.push(...await getReportingIds(item._id));
            // }
            ids.push(item._id); 
        }
        return ids
    } catch (error) {
        console.log(error);
        return [];
    }
}

module.exports = {getReportingIds};